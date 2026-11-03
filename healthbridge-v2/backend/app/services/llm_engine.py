import os
import re
import time
import json
import httpx
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from app.schemas.triage import TriageEngineResponse, DecisionFlipTest
from app.services.rag_service import retrieve_clinical_protocol
from app.services.clinical_calculator import calculate_news2, calculate_esi
from dotenv import load_dotenv

load_dotenv()

def get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=os.getenv("LLM_API_KEY", "mock-key"),
        base_url=os.getenv("LLM_BASE_URL", "https://api.meta.ai/v1"),
        timeout=90.0
    )

MODEL_NAME = os.getenv("LLM_MODEL", "muse-spark-1.3")

SYSTEM_PROMPT = """
You are HealthBridge, an autonomous bilingual (Bengali/English) emergency triage agent.
Conduct a dynamic, one-question-at-a-time clinical interview grounded in the retrieved WHO triage pathways.

CRITICAL INSTRUCTIONS:
1. Select the SINGLE next question most likely to change the safe clinical outcome.
2. Execute the Decision Flip Test in your structured output:
   - What unasked information could flip the recommended urgency?
   - Has the system explicitly verified that information?
   - Safety Guardrail: If a critical variable remains unknown or ambiguous, default to escalating care rather than offering reassurance.
3. Factor in patient objective vital signs (SpO2, Heart Rate, Blood Pressure) and NEWS2 / ESI scores.
4. Speak to the patient in the language they used last (Bengali or English).
"""

def _is_chest_negated(text: str) -> bool:
    """Checks if chest symptoms are explicitly ruled out (not just containing the word 'not')."""
    t = text.lower()
    if re.search(r"\b(?:no|without|denies|zero)\s+(?:acute\s+|severe\s+|known\s+)?(?:chest\s+)?(?:pain|pressure|discomfort)\b", t):
        return True
    if re.search(r"\bno\s+(?:pain|discomfort|pressure)\s+(?:in|around)\s+(?:the\s+|my\s+)?chest\b", t):
        return True
    return any(neg in t for neg in ["no chest", "ব্যথা নেই", "কোনো সমস্যা নেই", "কোন সমস্যা নেই", "বুকে ব্যথা নেই", "বুকে কোনো চাপ নেই"])

def _fallback_triage_logic(
    conversation_history: list,
    vitals: Optional[Dict[str, Any]] = None,
    selected_region: Optional[str] = None
) -> TriageEngineResponse:
    """
    Deterministic fallback pathway used when AI_PROVIDER_MODE='mock'
    or if the API returns a 401/402/429 quota exhaustion error.
    Integrates NEWS2 scoring and Emergency Severity Index (ESI).
    """
    user_msgs = [m.get("content", "").lower() for m in conversation_history if m.get("role") == "user"]
    last_user_msg = user_msgs[-1] if user_msgs else ""
    all_user_text = " ".join(user_msgs)

    # Scoped negation: avoids false negatives on phrases like "not feeling well, chest hurts"
    is_negated = _is_chest_negated(last_user_msg)
    chest_present = any(w in all_user_text for w in ["chest", "বুকে", "হার্ট"])
    has_cardiac_red_flag = chest_present and not is_negated

    other_red_flags = any(
        w in all_user_text
        for w in [
            "pressure", "চাপ", "slurred", "জড়িয়ে", "অবশ",
            "faint", "bleeding", "প্রচণ্ড", "কষ্ট", "radiat",
            "অজ্ঞান", "রক্তপাত", "breathless", "শ্বাসকষ্ট"
        ]
    )

    # Calculate objective vitals risk if available
    v_dict = vitals or {}
    news_res = calculate_news2(
        respiratory_rate=v_dict.get("respiratory_rate", 16),
        spo2=v_dict.get("spo2", 98),
        systolic_bp=v_dict.get("systolic_bp", 120),
        heart_rate=v_dict.get("heart_rate", 75),
        temp_celsius=v_dict.get("temperature", 37.0),
        avpu=v_dict.get("avpu", "Alert"),
        on_supplemental_o2=v_dict.get("on_supplemental_o2", False)
    )
    news2_score = news_res["score"]
    vital_signs_critical = (
        news2_score >= 7
        or v_dict.get("spo2", 98) <= 91
        or v_dict.get("avpu", "Alert").strip().upper() in ["VOICE", "PAIN", "UNRESPONSIVE"]
    )

    has_red_flags = has_cardiac_red_flag or other_red_flags or vital_signs_critical

    if has_red_flags:
        esi = calculate_esi(
            news2_score=news2_score,
            avpu=v_dict.get("avpu", "Alert"),
            spo2=v_dict.get("spo2", 98),
            pain_level=v_dict.get("pain_level", 0),
            has_high_risk_symptom=True,
            is_life_threatening=(v_dict.get("spo2", 98) < 85 or v_dict.get("avpu", "Alert").upper() == "UNRESPONSIVE")
        )
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": "None - Critical cardiac/neurological warning sign confirmed.",
                "has_verified_info": True,
                "should_escalate": True
            },
            current_severity="Severe",
            next_question=None,
            is_triage_complete=True,
            news2_score=news2_score,
            esi_level=esi,
            clinical_rationale=f"Escalated: Red flags or severe vitals instability confirmed. ESI Level {esi} assigned. NEWS2: {news2_score}.",
            provider_used="who-protocol",
            latency_seconds=0.01
        )
    elif (is_negated and len(conversation_history) >= 3) or len(conversation_history) >= 7:
        esi = calculate_esi(
            news2_score=news2_score,
            avpu=v_dict.get("avpu", "Alert"),
            spo2=v_dict.get("spo2", 98),
            pain_level=v_dict.get("pain_level", 0),
            has_high_risk_symptom=False
        )
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": "Red flags ruled out (no acute cardiac or neurological emergency, vitals stable).",
                "has_verified_info": True,
                "should_escalate": False
            },
            current_severity="Mild",
            next_question=None,
            is_triage_complete=True,
            news2_score=news2_score,
            esi_level=esi,
            clinical_rationale=f"Routine presentation: Red flags ruled out, vitals stable. ESI Level {esi}.",
            provider_used="who-protocol",
            latency_seconds=0.01
        )
    else:
        is_greeting = any(
            re.search(rf"\b{g}\b", last_user_msg)
            for g in ["hello", "hi", "hey", "hola", "greetings", "হ্যালো", "সালাম", "নমস্কার", "শুভ"]
        ) and len(last_user_msg.split()) <= 4

        is_trauma = any(w in all_user_text for w in ["burn", "wound", "পুড়ে", "ক্ষত", "কাটা"])
        is_dizzy = any(w in all_user_text for w in ["dizzy", "মাথা", "ঘুর", "দুর্বল", "faint"])
        is_sleep = any(w in all_user_text for w in ["sleep", "ঘুম", "insomnia", "tired", "fatigue", "exhaust"])

        if is_greeting:
            question = "হ্যালো! আমি হেলথব্রিজ জরুরি ট্রায়াজ সহকারী। আপনার বা রোগীর কী কী শারীরিক সমস্যা বা লক্ষণ দেখা দিচ্ছে অনুগ্রহ করে বিস্তারিত বলুন। (Hello! I am HealthBridge triage assistant. What symptoms or medical emergency are you or the patient experiencing?)"
            missing_info = "Patient chief complaint and acute symptom onset"
        elif is_trauma:
            question = "ক্ষতস্থান থেকে কি অবিরাম রক্তক্ষরণ হচ্ছে বা চামড়ার গভীর অংশ দেখা যাচ্ছে? (Is there continuous bleeding or visible deep tissue?)"
            missing_info = "Presence of active arterial bleeding or deep fascial exposure"
        elif is_sleep:
            question = "ঘুমের সমস্যা কতদিন ধরে হচ্ছে? অতিরিক্ত ক্লান্তির পাশাপাশি মাথা ঘোরা, বুক ধড়ফড় বা তীব্র অবসাদ অনুভব করছেন কি? (How long have you had this sleep deprivation? Are you experiencing palpitations, lightheadedness, or severe exhaustion?)"
            missing_info = "Duration of sleep deprivation and presence of acute exhaustion red flags"
        elif is_dizzy:
            question = "আপনার কি মাথা ঘোরার পাশাপাশি বুকে চাপ বা কথা বলতে কোনো সমস্যা হচ্ছে? (Are you experiencing chest pressure or difficulty speaking alongside the dizziness?)"
            missing_info = "Presence of chest pain, shortness of breath, active bleeding, or slurred speech"
        else:
            question = "আপনার কি বুকে ব্যথা, শ্বাসকষ্ট, প্রচণ্ড পেটব্যথা বা কথা বলতে কোনো সমস্যা হচ্ছে? (Are you experiencing chest pain, shortness of breath, severe abdominal pain, or difficulty speaking?)"
            missing_info = "Critical red flags: cardiac, respiratory, or acute neurological deficits"

        esi = calculate_esi(
            news2_score=news2_score,
            avpu=v_dict.get("avpu", "Alert"),
            spo2=v_dict.get("spo2", 98),
            pain_level=v_dict.get("pain_level", 0),
            has_high_risk_symptom=False
        )
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": missing_info,
                "has_verified_info": False,
                "should_escalate": not is_greeting
            },
            current_severity="Moderate",
            next_question=question,
            is_triage_complete=False,
            news2_score=news2_score,
            esi_level=esi,
            clinical_rationale=f"Evaluation in progress. Verifying missing critical indicators. Baseline NEWS2: {news2_score}.",
            provider_used="who-protocol",
            latency_seconds=0.01
        )

async def _call_gemini_triage(
    conversation_history: list,
    system_content: str,
    vitals: Optional[Dict[str, Any]] = None,
    selected_region: Optional[str] = None
) -> Optional[TriageEngineResponse]:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or gemini_key == "mock-key":
        return None

    formatted_dialogue = []
    for m in conversation_history:
        role = "Patient" if m.get("role") == "user" else "Triage Doctor (HealthBridge)"
        formatted_dialogue.append(f"{role}: {m.get('content', '')}")
    dialogue_text = "\n".join(formatted_dialogue)

    full_prompt = f"""
{system_content}

CURRENT PATIENT CONVERSATION HISTORY:
{dialogue_text}

Analyze the patient presentation according to WHO protocols and clinical red flags.
Respond in valid JSON with this schema:
{{
  "current_severity": "Severe" | "Moderate" | "Mild",
  "next_question": "Single next focused question in user's language (Bengali or English), or null if triage is complete",
  "is_triage_complete": true or false,
  "clinical_rationale": "Clinical rationale explaining the assigned severity, vital sign interpretation, and next steps",
  "decision_flip_test": {{
    "missing_critical_info": "Specific variable that could escalate urgency if positive",
    "has_verified_info": true or false,
    "should_escalate": true or false
  }}
}}
"""

    models = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview"]
    headers = {"Content-Type": "application/json", "x-goog-api-key": gemini_key}
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.2
        }
    }

    t0 = time.time()
    async with httpx.AsyncClient(timeout=25.0) as client:
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            try:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    if parts:
                        raw_json = parts[0].get("text", "")
                        parsed_dict = json.loads(raw_json)

                        sev = parsed_dict.get("current_severity", "Moderate").title()
                        if sev not in ["Mild", "Moderate", "Severe"]:
                            sev = "Moderate"

                        flip_raw = parsed_dict.get("decision_flip_test", {})
                        if isinstance(flip_raw, str):
                            flip_obj = DecisionFlipTest(
                                missing_critical_info=flip_raw,
                                has_verified_info=False,
                                should_escalate=(sev == "Severe")
                            )
                        else:
                            flip_obj = DecisionFlipTest(
                                missing_critical_info=flip_raw.get("missing_critical_info", "Critical red flags"),
                                has_verified_info=bool(flip_raw.get("has_verified_info", False)),
                                should_escalate=bool(flip_raw.get("should_escalate", sev == "Severe"))
                            )

                        dur = round(time.time() - t0, 2)
                        return TriageEngineResponse(
                            current_severity=sev,
                            next_question=parsed_dict.get("next_question"),
                            is_triage_complete=bool(parsed_dict.get("is_triage_complete", False)),
                            clinical_rationale=parsed_dict.get("clinical_rationale", "Evaluated via Gemini Flash."),
                            decision_flip_test=flip_obj,
                            provider_used=f"gemini-flash ({model})",
                            latency_seconds=dur
                        )
                elif resp.status_code in [404, 503, 429]:
                    print(f"[Gemini Triage {resp.status_code}] on {model}: {resp.text[:100]}")
                    continue
                else:
                    print(f"[Gemini Triage HTTP {resp.status_code}] on {model}: {resp.text[:150]}")
            except Exception as e:
                import traceback
                print(f"[Gemini Triage Failover] {model} exception: {repr(e)}")
                traceback.print_exc()
                continue

    return None

async def _call_meta_triage(
    conversation_history: list,
    system_content: str
) -> Optional[TriageEngineResponse]:
    t0 = time.time()
    messages = [{"role": "system", "content": system_content}] + conversation_history
    llm_client = get_client()
    response = await llm_client.beta.chat.completions.parse(
        model=MODEL_NAME,
        messages=messages,
        response_format=TriageEngineResponse,
        temperature=0.2,
        max_tokens=4096
    )
    parsed = response.choices[0].message.parsed
    parsed.provider_used = f"meta ({MODEL_NAME})"
    parsed.latency_seconds = round(time.time() - t0, 2)
    return parsed

async def process_triage_turn(
    conversation_history: list,
    visual_context: str = "",
    vitals: Optional[Dict[str, Any]] = None,
    selected_region: Optional[str] = None,
    provider: Optional[str] = None
) -> TriageEngineResponse:
    target_provider = (provider or os.getenv("AI_PROVIDER_MODE", "gemini")).lower()

    if target_provider in ["mock", "protocol", "who_protocol"]:
        return _fallback_triage_logic(conversation_history, vitals, selected_region)

    full_text = " ".join([m.get("content", "") for m in conversation_history])
    rag_context = retrieve_clinical_protocol(full_text)

    system_content = f"{SYSTEM_PROMPT}\n\nRETRIEVED CLINICAL PATHWAY:\n{rag_context}"
    if visual_context:
        system_content += f"\n\nSAM 3.1 VISUAL SYMPTOM CONTEXT:\n{visual_context}"
    if vitals:
        system_content += f"\n\nPATIENT VITALS & SCORES: {vitals}"
    if selected_region:
        system_content += f"\n\nANATOMICAL FOCUS REGION: {selected_region}"

    res = None
    if "gemini" in target_provider:
        res = await _call_gemini_triage(conversation_history, system_content, vitals, selected_region)
        if not res:
            try:
                res = await _call_meta_triage(conversation_history, system_content)
            except Exception as e:
                print(f"[Meta Failover] {e}")
                res = _fallback_triage_logic(conversation_history, vitals, selected_region)
    elif "meta" in target_provider:
        try:
            res = await _call_meta_triage(conversation_history, system_content)
        except Exception as e:
            print(f"[Meta Error] {e}. Fast failover to Gemini Flash.")
            res = await _call_gemini_triage(conversation_history, system_content, vitals, selected_region)
            if not res:
                res = _fallback_triage_logic(conversation_history, vitals, selected_region)
    else:
        res = _fallback_triage_logic(conversation_history, vitals, selected_region)

    if res and res.news2_score is None and vitals:
        v_calc = calculate_news2(
            respiratory_rate=vitals.get("respiratory_rate", 16),
            spo2=vitals.get("spo2", 98),
            systolic_bp=vitals.get("systolic_bp", 120),
            heart_rate=vitals.get("heart_rate", 75),
            temp_celsius=vitals.get("temperature", 37.0),
            avpu=vitals.get("avpu", "Alert"),
            on_supplemental_o2=vitals.get("on_supplemental_o2", False)
        )
        res.news2_score = v_calc["score"]
        res.esi_level = calculate_esi(
            news2_score=v_calc["score"],
            avpu=vitals.get("avpu", "Alert"),
            spo2=vitals.get("spo2", 98),
            pain_level=vitals.get("pain_level", 0),
            has_high_risk_symptom=(res.current_severity == "Severe")
        )

    return res

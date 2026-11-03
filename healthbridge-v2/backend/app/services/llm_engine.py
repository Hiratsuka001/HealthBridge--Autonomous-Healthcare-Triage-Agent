import os
import re
from typing import Optional, Dict, Any
from openai import AsyncOpenAI
from app.schemas.triage import TriageEngineResponse
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
            clinical_rationale=f"Escalated: Red flags or severe vitals instability confirmed. ESI Level {esi} assigned. NEWS2: {news2_score}."
        )
    elif len(conversation_history) >= 3:
        esi = calculate_esi(
            news2_score=news2_score,
            avpu=v_dict.get("avpu", "Alert"),
            spo2=v_dict.get("spo2", 98),
            pain_level=v_dict.get("pain_level", 0),
            has_high_risk_symptom=False
        )
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": "Red flags ruled out (no chest pain, no stroke signs).",
                "has_verified_info": True,
                "should_escalate": False
            },
            current_severity="Mild",
            next_question=None,
            is_triage_complete=True,
            news2_score=news2_score,
            esi_level=esi,
            clinical_rationale=f"Routine presentation: Red flags ruled out, vitals stable. ESI Level {esi}."
        )
    else:
        is_greeting = any(
            re.search(rf"\b{g}\b", last_user_msg)
            for g in ["hello", "hi", "hey", "hola", "greetings", "হ্যালো", "সালাম", "নমস্কার", "শুভ"]
        ) and len(last_user_msg.split()) <= 4

        is_trauma = any(w in all_user_text for w in ["burn", "wound", "পুড়ে", "ক্ষত", "কাটা"])
        is_dizzy = any(w in all_user_text for w in ["dizzy", "মাথা", "ঘুর", "দুর্বল", "faint"])

        if is_greeting:
            question = "হ্যালো! আমি হেলথব্রিজ জরুরি ট্রায়াজ সহকারী। আপনার বা রোগীর কী কী শারীরিক সমস্যা বা লক্ষণ দেখা দিচ্ছে অনুগ্রহ করে বিস্তারিত বলুন। (Hello! I am HealthBridge triage assistant. What symptoms or medical emergency are you or the patient experiencing?)"
            missing_info = "Patient chief complaint and acute symptom onset"
        elif is_trauma:
            question = "ক্ষতস্থান থেকে কি অবিরাম রক্তক্ষরণ হচ্ছে বা চামড়ার গভীর অংশ দেখা যাচ্ছে? (Is there continuous bleeding or visible deep tissue?)"
            missing_info = "Presence of active arterial bleeding or deep fascial exposure"
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
            clinical_rationale=f"Evaluation in progress. Verifying missing critical indicators. Baseline NEWS2: {news2_score}."
        )

async def process_triage_turn(
    conversation_history: list,
    visual_context: str = "",
    vitals: Optional[Dict[str, Any]] = None,
    selected_region: Optional[str] = None
) -> TriageEngineResponse:
    full_text = " ".join([m.get("content", "") for m in conversation_history])
    rag_context = retrieve_clinical_protocol(full_text)

    system_content = f"{SYSTEM_PROMPT}\n\nRETRIEVED CLINICAL PATHWAY:\n{rag_context}"
    if visual_context:
        system_content += f"\n\nSAM 3.1 VISUAL SYMPTOM CONTEXT:\n{visual_context}"
    if vitals:
        system_content += f"\n\nPATIENT VITALS & SCORES: {vitals}"
    if selected_region:
        system_content += f"\n\nANATOMICAL FOCUS REGION: {selected_region}"

    if os.getenv("AI_PROVIDER_MODE", "mock") == "mock":
        return _fallback_triage_logic(conversation_history, vitals, selected_region)

    try:
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
        # Ensure NEWS2 and ESI are populated
        if parsed.news2_score is None and vitals:
            v_calc = calculate_news2(
                respiratory_rate=vitals.get("respiratory_rate", 16),
                spo2=vitals.get("spo2", 98),
                systolic_bp=vitals.get("systolic_bp", 120),
                heart_rate=vitals.get("heart_rate", 75),
                temp_celsius=vitals.get("temperature", 37.0),
                avpu=vitals.get("avpu", "Alert"),
                on_supplemental_o2=vitals.get("on_supplemental_o2", False)
            )
            parsed.news2_score = v_calc["score"]
            parsed.esi_level = calculate_esi(
                news2_score=v_calc["score"],
                avpu=vitals.get("avpu", "Alert"),
                spo2=vitals.get("spo2", 98),
                pain_level=vitals.get("pain_level", 0),
                has_high_risk_symptom=(parsed.current_severity == "Severe")
            )
        return parsed
    except Exception as e:
        print(f"[HealthBridge Failover] API error or quota exceeded ({e}). Falling back to cached clinical pathway.")
        return _fallback_triage_logic(conversation_history, vitals, selected_region)

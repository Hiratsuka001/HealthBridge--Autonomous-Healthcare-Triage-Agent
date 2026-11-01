import os
from openai import AsyncOpenAI
from app.schemas.triage import TriageEngineResponse
from app.services.rag_service import retrieve_clinical_protocol
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("LLM_API_KEY", "mock-key"),
    base_url=os.getenv("LLM_BASE_URL", "https://api.dev.meta.ai/v1")
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
3. Speak to the patient in the language they used last (Bengali or English).
"""

def _fallback_triage_logic(conversation_history: list) -> TriageEngineResponse:
    """
    Deterministic fallback pathway used when AI_PROVIDER_MODE='mock'
    or if the API returns a 401/402/429 quota exhaustion error.
    """
    user_msgs = [m.get("content", "").lower() for m in conversation_history if m.get("role") == "user"]
    last_user_msg = user_msgs[-1] if user_msgs else ""
    all_user_text = " ".join(user_msgs)

    is_negated = any(neg in last_user_msg for neg in ["no chest", "নেই", "ব্যথা নেই", "কোনো সমস্যা নেই", "not "])
    has_red_flags = any(w in all_user_text for w in ["pressure", "চাপ", "slurred", "জড়িয়ে", "অবশ", "faint", "bleeding", "প্রচণ্ড", "কষ্ট"]) or (
        any(w in all_user_text for w in ["chest", "বুকে"]) and not is_negated
    )
    if has_red_flags:
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": "None - Critical cardiac/neurological warning sign confirmed.",
                "has_verified_info": True,
                "should_escalate": True
            },
            current_severity="Severe",
            next_question=None,
            is_triage_complete=True
        )
    elif len(conversation_history) >= 3:
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": "Red flags ruled out (no chest pain, no stroke signs).",
                "has_verified_info": True,
                "should_escalate": False
            },
            current_severity="Mild",
            next_question=None,
            is_triage_complete=True
        )
    else:
        is_trauma = any(w in all_user_text for w in ["burn", "wound", "পুড়ে", "ক্ষত", "কাটা"])
        question = (
            "ক্ষতস্থান থেকে কি অবিরাম রক্তক্ষরণ হচ্ছে বা চামড়ার গভীর অংশ দেখা যাচ্ছে? (Is there continuous bleeding or visible deep tissue?)"
            if is_trauma else
            "আপনার কি মাথা ঘোরার পাশাপাশি বুকে চাপ বা কথা বলতে কোনো সমস্যা হচ্ছে? (Are you experiencing chest pressure or difficulty speaking alongside the dizziness?)"
        )
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": "Presence of chest pain, shortness of breath, active bleeding, or slurred speech",
                "has_verified_info": False,
                "should_escalate": True
            },
            current_severity="Moderate",
            next_question=question,
            is_triage_complete=False
        )

async def process_triage_turn(conversation_history: list, visual_context: str = "") -> TriageEngineResponse:
    full_text = " ".join([m.get("content", "") for m in conversation_history])
    rag_context = retrieve_clinical_protocol(full_text)

    system_content = f"{SYSTEM_PROMPT}\n\nRETRIEVED CLINICAL PATHWAY:\n{rag_context}"
    if visual_context:
        system_content += f"\n\nSAM 3.1 VISUAL SYMPTOM CONTEXT:\n{visual_context}"

    if os.getenv("AI_PROVIDER_MODE", "mock") == "mock":
        return _fallback_triage_logic(conversation_history)

    try:
        messages = [{"role": "system", "content": system_content}] + conversation_history
        response = await client.beta.chat.completions.parse(
            model=MODEL_NAME,
            messages=messages,
            response_format=TriageEngineResponse,
            temperature=0.2
        )
        return response.choices[0].message.parsed
    except Exception as e:
        print(f"[HealthBridge Failover] API error or quota exceeded ({e}). Falling back to cached clinical pathway.")
        return _fallback_triage_logic(conversation_history)

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

async def process_triage_turn(conversation_history: list, visual_context: str = "") -> TriageEngineResponse:
    full_text = " ".join([m.get("content", "") for m in conversation_history])
    rag_context = retrieve_clinical_protocol(full_text)

    system_content = f"{SYSTEM_PROMPT}\n\nRETRIEVED CLINICAL PATHWAY:\n{rag_context}"
    if visual_context:
        system_content += f"\n\nSAM 3.1 VISUAL SYMPTOM CONTEXT:\n{visual_context}"

    # Smart Mock Mode for testing split-screen branching without spending credits
    if os.getenv("AI_PROVIDER_MODE", "mock") == "mock":
        last_msg = conversation_history[-1]["content"].lower() if conversation_history else ""
        if any(w in last_msg for w in ["chest", "বুকে", "slurred", "অবশ", "faint", "bleeding"]):
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
            return TriageEngineResponse(
                decision_flip_test={
                    "missing_critical_info": "Presence of chest pain, shortness of breath, or one-sided weakness/slurred speech",
                    "has_verified_info": False,
                    "should_escalate": True
                },
                current_severity="Moderate",
                next_question="আপনার কি মাথা ঘোরার পাশাপাশি বুকে চাপ বা কথা বলতে কোনো সমস্যা হচ্ছে? (Are you experiencing chest pressure or difficulty speaking alongside the dizziness?)",
                is_triage_complete=False
            )

    messages = [{"role": "system", "content": system_content}] + conversation_history
    response = await client.beta.chat.completions.parse(
        model=MODEL_NAME,
        messages=messages,
        response_format=TriageEngineResponse,
        temperature=0.2
    )
    return response.choices[0].message.parsed

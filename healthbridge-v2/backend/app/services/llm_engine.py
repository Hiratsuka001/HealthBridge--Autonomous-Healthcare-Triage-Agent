import os
from openai import AsyncOpenAI
from app.schemas.triage import TriageEngineResponse
from dotenv import load_dotenv

load_dotenv()

# Initialize the client pointing to Meta's API base URL (or your fallback)
client = AsyncOpenAI(
    api_key=os.getenv("LLM_API_KEY"),
    base_url=os.getenv("LLM_BASE_URL", "https://api.dev.meta.ai/v1")
)

MODEL_NAME = os.getenv("LLM_MODEL", "muse-spark-1.3")

SYSTEM_PROMPT = """
You are HealthBridge, an autonomous bilingual (Bengali/English) emergency triage agent.
Your goal is to conduct a dynamic, one-question-at-a-time clinical interview grounded in WHO triage pathways.

CRITICAL INSTRUCTIONS:
1. Do NOT ask a static list of questions. Select the SINGLE next question most likely to change the safe clinical outcome.
2. Execute the Decision Flip Test silently in your structured output:
   - Identify what unasked information could flip the urgency.
   - If that information is unknown, lean towards escalation.
3. If severity is definitively 'Severe', set is_triage_complete to True immediately.
4. Speak to the patient in the language they used last (Bengali or English).
"""

async def process_triage_turn(conversation_history: list) -> TriageEngineResponse:
    """
    conversation_history format: [{"role": "user", "content": "I feel dizzy"}, ...]
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + conversation_history

    # If AI_PROVIDER_MODE is "mock", return a hardcoded response to save API credits during dev
    if os.getenv("AI_PROVIDER_MODE") == "mock":
        return TriageEngineResponse(
            decision_flip_test={
                "missing_critical_info": "Onset time and presence of chest pain",
                "has_verified_info": False,
                "should_escalate": False
            },
            current_severity="Moderate",
            next_question="I understand you are dizzy. Do you also feel any pain in your chest or shortness of breath?",
            is_triage_complete=False
        )

    # Call the Meta Model API with structured outputs
    response = await client.beta.chat.completions.parse(
        model=MODEL_NAME,
        messages=messages,
        response_format=TriageEngineResponse,
        temperature=0.2 # Low temperature for more deterministic clinical reasoning
    )

    return response.choices[0].message.parsed


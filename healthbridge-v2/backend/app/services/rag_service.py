import json
import os

PROTOCOLS_PATH = os.path.join(os.path.dirname(__file__), "../data/who_triage_protocols.json")

def retrieve_clinical_protocol(conversation_text: str) -> str:
    try:
        with open(PROTOCOLS_PATH, "r", encoding="utf-8") as f:
            protocols = json.load(f)
    except FileNotFoundError:
        return "Standard WHO Emergency Triage: Prioritize Airway, Breathing, Circulation, and Neurological red flags."

    text_lower = conversation_text.lower()
    matched_protocols = []

    for category, data in protocols.items():
        if any(kw in text_lower for kw in data["symptom_keywords"]):
            matched_protocols.append(
                f"--- PROTOCOL [{category.upper()}] ---\n"
                f"Critical Red Flags to check: {', '.join(data['critical_red_flags'])}\n"
                f"Decision Flip Rule: {data['decision_flip_rule']}\n"
            )

    if not matched_protocols:
        return "No specific keyword match. Apply general WHO Emergency Triage (check airway, breathing, circulation, consciousness)."

    return "\n".join(matched_protocols)


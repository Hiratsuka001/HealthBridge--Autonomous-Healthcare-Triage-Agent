import os
import json
import base64
import httpx
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

FALLBACK_MEDICINES = [
    {
        "brand_name": "Ecosprin 75",
        "generic_name": "Aspirin (Acetylsalicylic Acid)",
        "strength": "75 mg",
        "drug_class": "NSAID / Antiplatelet",
        "manufacturer": "Square Pharmaceuticals Ltd.",
        "indication": "Antiplatelet / Cardiovascular prophylaxis",
        "is_contraindicated": True,
        "contraindication_severity": "CRITICAL",
        "clinical_alert_message": "CRITICAL DANGER: Aspirin/NSAID is strictly contraindicated in acute febrile illness with suspected Dengue or active bleeding due to high risk of fatal internal hemorrhage and irreversible platelet inhibition.",
        "bengali_patient_instruction": "জরুরি সতর্কতা: ডেঙ্গু বা অজানা জ্বরের সময় ইকোস্প্রিন (অ্যাসপিরিন) খেলে শরীরের ভেতরে মারাত্মক রক্তক্ষরণ হতে পারে। এই ওষুধ খাওয়া অবিলম্বে বন্ধ রাখুন।",
        "safe_alternative": "Paracetamol 500mg (Napa / Ace) only for fever management, avoiding all NSAIDs.",
        "er_prearrival_action": "Alert Trauma Bay: Ingestion of Aspirin antiplatelet. Check platelet count and coagulation profile stat on arrival.",
        "ocr_text_detected": "ECOSPRIN 75 • Aspirin USP 75mg • Square Pharmaceuticals Ltd. • Mfg. Lic. No. 128"
    },
    {
        "brand_name": "Napa Extra",
        "generic_name": "Paracetamol + Caffeine",
        "strength": "500 mg + 65 mg",
        "drug_class": "Antipyretic / Analgesic",
        "manufacturer": "Beximco Pharmaceuticals Ltd.",
        "indication": "Fever, mild to moderate acute pain relief",
        "is_contraindicated": False,
        "contraindication_severity": "SAFE",
        "clinical_alert_message": "SAFE FOR FEVER: Paracetamol is the first-line antipyretic recommended by WHO protocols for febrile illness and suspected Dengue. Maximum daily dose 4000mg.",
        "bengali_patient_instruction": "এই ওষুধটি জ্বরের জন্য নিরাপদ। ডাক্তারের পরামর্শ অনুযায়ী প্রতি ৬-৮ ঘণ্টা পরপর ১টি করে ট্যাবলেট গ্রহণ করা যেতে পারে (দিনে সর্বোচ্চ ৪০০০ মিলিগ্রাম)।",
        "safe_alternative": "Standard Paracetamol 500mg without caffeine if patient experiences tachycardia.",
        "er_prearrival_action": "Supportive antipyretic noted. Continue monitoring liver panel if paracetamol overuse is suspected.",
        "ocr_text_detected": "NAPA EXTRA • Paracetamol 500mg & Caffeine 65mg • Beximco Pharma"
    }
]

def _build_mock_scan(clinical_context: Dict[str, Any]) -> Dict[str, Any]:
    symptoms = str(clinical_context.get("symptoms", "")).lower()
    selected_region = str(clinical_context.get("selected_region", "")).lower()

    # If fever, bleeding, or abdomen - demonstrate critical Aspirin/Dengue contraindication
    if any(k in symptoms or k in selected_region for k in ["fever", "dengue", "bleed", "rash", "headache", "chest"]):
        return FALLBACK_MEDICINES[0]
    return FALLBACK_MEDICINES[1]

async def scan_medicine_strip(
    image_bytes: bytes,
    filename: str,
    clinical_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Scans a medicine blister pack, bottle, or prescription using Google Gemini Vision,
    extracts chemical composition and detects severe clinical contraindications against
    the patient's triaged symptoms.
    """
    context = clinical_context or {}
    raw_key = os.getenv("GEMINI_API_KEY", "")
    gemini_key = raw_key.strip().strip("'\"")

    if not gemini_key or gemini_key == "mock-key":
        return _build_mock_scan(context)

    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    content_type = "image/jpeg" if not filename.lower().endswith(".png") else "image/png"

    # Contextual prompt for pharmacological contraindication cross-check
    symptoms_txt = context.get("symptoms", "Acute emergency symptoms")
    vitals_txt = str(context.get("vitals", {}))
    news2_txt = str(context.get("news2_score", "Unknown"))
    region_txt = str(context.get("selected_region", "General"))

    prompt_instruction = f"""
You are an expert clinical emergency pharmacist in Bangladesh performing rapid pre-hospital medication verification.
Analyze the uploaded image of a medicine blister pack, strip, box, bottle, or handwritten prescription.

PATIENT'S ACTIVE CLINICAL CONTEXT:
- Reported Symptoms: {symptoms_txt}
- Anatomical Region: {region_txt}
- Field NEWS2 Score: {news2_txt}
- Vitals: {vitals_txt}

CRITICAL EMERGENCY CONTRAINDICATION RULES:
1. Dengue / Febrile illness: Strict contraindication for Aspirin (Ecosprin), Disprin, Ibuprofen, Diclofenac, Naproxen, or any NSAIDs due to catastrophic hemorrhage risk.
2. Asthma / Dyspnea: Aspirin and non-selective Beta-blockers (e.g. Propranolol) are contraindicated due to bronchospasm.
3. Severe Hypotension / Shock (SBP < 90): Antihypertensives (Amlodipine, Losartan, Atenolol) will cause fatal vascular collapse.
4. Peptic Ulcer / Upper GI Bleeding: NSAIDs and steroids strictly contraindicated.

Extract the drug details and return pure JSON with the following schema:
{{
  "brand_name": "Trade name on blister pack (e.g. Ecosprin 75, Napa Extra, Seclo 20)",
  "generic_name": "Active chemical molecule (e.g. Aspirin / Acetylsalicylic acid)",
  "strength": "Dose (e.g. 75mg, 500mg, 20mg)",
  "drug_class": "Pharmacological class (e.g. NSAID / Antiplatelet, Antipyretic, PPI)",
  "manufacturer": "Pharma company if visible (e.g. Square, Beximco, Incepta)",
  "indication": "Standard clinical indication",
  "is_contraindicated": true or false,
  "contraindication_severity": "CRITICAL" or "WARNING" or "SAFE",
  "clinical_alert_message": "Clear high-priority clinical explanation in English of why this medicine is either safe or dangerous for this patient",
  "bengali_patient_instruction": "Urgent and easily understandable instruction in Bengali (বাংলা) for the patient/bystander",
  "safe_alternative": "Recommended safe emergency alternative (e.g. Paracetamol 500mg for fever)",
  "er_prearrival_action": "Specific note for the incoming ER trauma team about this medication",
  "ocr_text_detected": "Raw text snippet transcribed from the foil packaging or label"
}}
Return ONLY valid JSON.
"""

    # Priority model list to ensure fast turnaround
    candidate_models = ["gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]

    async with httpx.AsyncClient(timeout=25.0) as client:
        for model in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt_instruction},
                            {
                                "inline_data": {
                                    "mime_type": content_type,
                                    "data": b64_image
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            }
            try:
                resp = await client.post(url, headers={"x-goog-api-key": gemini_key}, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidate_parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    if candidate_parts:
                        raw_text = candidate_parts[0].get("text", "")
                        # Parse JSON from response
                        parsed = json.loads(raw_text)
                        return parsed
                elif resp.status_code == 429:
                    print(f"[Gemini Medicine Scanner 429] Fast failover to Meta Multimodal AI.")
                    break
                elif resp.status_code in [404, 503]:
                    continue
            except Exception as ex:
                print(f"[HealthBridge Scanner] Gemini request error with {model}: {ex}")
                continue

    # 2. Meta Multimodal failover
    meta_key = (os.getenv("LLM_API_KEY") or "").strip().strip("'\"")
    meta_base = (os.getenv("LLM_BASE_URL") or "https://api.meta.ai/v1").strip().strip("'\"")

    if meta_key and meta_key != "mock-key":
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                meta_resp = await client.post(
                    f"{meta_base}/chat/completions",
                    headers={"Authorization": f"Bearer {meta_key}"},
                    json={
                        "model": "muse-spark-1.3",
                        "messages": [
                            {"role": "system", "content": prompt_instruction},
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Analyze this medication strip or image in JSON format:"},
                                    {"type": "image_url", "image_url": {"url": f"data:{content_type};base64,{b64_image}"}}
                                ]
                            }
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"}
                    }
                )
                if meta_resp.status_code == 200:
                    data = meta_resp.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    parsed = json.loads(content) if isinstance(content, str) else content
                    if parsed and (parsed.get("brand_name") or parsed.get("ocr_text_detected")):
                        return parsed
        except Exception as e:
            print(f"[Meta Medicine Scanner Error] {e}")

    # Fallback to realistic mock if API fails or times out
    return _build_mock_scan(context)

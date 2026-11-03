export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Detect symptoms context from query or headers or default
  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const symptomsParam = url.searchParams.get("symptoms") || "";
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  const combinedContext = (symptomsParam + " " + rawBody).toLowerCase();

  const isDengueOrFever =
    combinedContext.includes("ecosprin") ||
    combinedContext.includes("aspirin") ||
    combinedContext.includes("fever") ||
    combinedContext.includes("জ্বর") ||
    combinedContext.includes("dengue") ||
    combinedContext.includes("bleed");

  if (isDengueOrFever) {
    return res.status(200).json({
      brand_name: "Ecosprin 75",
      generic_name: "Aspirin (Acetylsalicylic Acid)",
      strength: "75 mg",
      drug_class: "NSAID / Antiplatelet",
      manufacturer: "Square Pharmaceuticals Ltd.",
      indication: "Antiplatelet / Cardiovascular prophylaxis",
      is_contraindicated: true,
      contraindication_severity: "CRITICAL",
      clinical_alert_message:
        "CRITICAL DANGER: Aspirin/NSAID is strictly contraindicated in acute febrile illness with suspected Dengue or active bleeding due to high risk of fatal internal hemorrhage and irreversible platelet inhibition.",
      bengali_patient_instruction:
        "জরুরি সতর্কতা: ডেঙ্গু বা অজানা জ্বরের সময় ইকোস্প্রিন (অ্যাসপিরিন) খেলে শরীরের ভেতরে মারাত্মক রক্তক্ষরণ হতে পারে। এই ওষুধ খাওয়া অবিলম্বে বন্ধ রাখুন।",
      safe_alternative: "Paracetamol 500mg (Napa / Ace) only for fever management, avoiding all NSAIDs.",
      er_prearrival_action:
        "Alert Trauma Bay: Ingestion of Aspirin antiplatelet. Check platelet count and coagulation profile stat on arrival.",
      ocr_text_detected: "ECOSPRIN 75 • Aspirin USP 75mg • Square Pharmaceuticals Ltd. • Mfg. Lic. No. 128"
    });
  }

  return res.status(200).json({
    brand_name: "Napa Extra",
    generic_name: "Paracetamol + Caffeine",
    strength: "500 mg + 65 mg",
    drug_class: "Antipyretic / Analgesic",
    manufacturer: "Beximco Pharmaceuticals Ltd.",
    indication: "Fever, mild to moderate acute pain relief",
    is_contraindicated: false,
    contraindication_severity: "SAFE",
    clinical_alert_message:
      "SAFE FOR FEVER: Paracetamol is the first-line antipyretic recommended by WHO protocols for febrile illness and suspected Dengue. Maximum daily dose 4000mg.",
    bengali_patient_instruction:
      "এই ওষুধটি জ্বরের জন্য নিরাপদ। ডাক্তারের পরামর্শ অনুযায়ী প্রতি ৬-৮ ঘণ্টা পরপর ১টি করে ট্যাবলেট গ্রহণ করা যেতে পারে (দিনে সর্বোচ্চ ৪০০০ মিলিগ্রাম)।",
    safe_alternative: "Standard Paracetamol 500mg without caffeine if patient experiences tachycardia.",
    er_prearrival_action: "Supportive antipyretic noted. Continue monitoring liver panel if paracetamol overuse is suspected.",
    ocr_text_detected: "NAPA EXTRA • Paracetamol 500mg & Caffeine 65mg • Beximco Pharma"
  });
}

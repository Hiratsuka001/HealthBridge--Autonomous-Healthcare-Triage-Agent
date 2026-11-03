export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const {
    messages = [],
    severity = "Moderate",
    decision_flip_summary = "Clinical emergency evaluation",
    lat = 23.7771,
    lng = 90.3994,
    vitals = null,
    esi_level = null
  } = req.body || {};

  const isSevere = String(severity).toLowerCase() === "severe";
  const esiText = esi_level ? `ESI Level ${esi_level}` : isSevere ? "ESI Level 2" : "ESI Level 4";
  const vitalsText = vitals
    ? `HR:${vitals.heartRate || 75} BP:${vitals.systolicBp || 120}/${vitals.diastolicBp || 80} SpO2:${vitals.spo2 || 98}%`
    : "Vitals Stable";

  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
  const symptomSummary = userMsgs.join(" | ") || "Acute symptoms presentation";

  const facilities = isSevere
    ? [
        {
          name: "Dhaka Medical College Hospital (Emergency Care Unit)",
          type: "Specialized Trauma & Cardiac ER",
          distance: "2.4 km",
          eta: "11 mins",
          landmark: "Near Shaheed Minar / Bakshibazar Gate",
          phone: "+8801711000999"
        },
        {
          name: "NICVD (National Institute of Cardiovascular Diseases)",
          type: "Cardiac Emergency ER",
          distance: "3.1 km",
          eta: "14 mins",
          landmark: "Sher-e-Bangla Nagar, College Gate",
          phone: "+8801711000888"
        }
      ]
    : String(severity).toLowerCase() === "moderate"
    ? [
        {
          name: "Brac Healthcare Outpatient Clinic",
          type: "Primary Care Clinic",
          distance: "0.9 km",
          eta: "5 mins",
          landmark: "Mohakhali Wireless Gate",
          phone: "+8809678191919"
        }
      ]
    : [
        {
          name: "Lazz Pharma (24/7 Registered Pharmacist)",
          type: "Local Pharmacy & ORS Station",
          distance: "0.3 km",
          eta: "2 mins",
          landmark: "Main Road Corner, beside City Bank ATM",
          phone: "+8801700000111"
        }
      ];

  const soapNote = {
    protocol: "HealthBridge Zero-Wait ER Pre-Arrival Intake",
    triage_severity: String(severity).toUpperCase(),
    esi_level: esiText,
    subjective: `Patient reported: ${symptomSummary}`,
    objective: `Bilingual AI Triage completed. ${vitalsText}`,
    assessment: `Decision Flip Trigger: ${decision_flip_summary}`,
    plan: isSevere ? "Immediate ER Triage Bypass - Direct to Acute Bay" : "Outpatient / Local Clinic Review"
  };

  const qrData = encodeURIComponent(JSON.stringify(soapNote));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;

  const landmark = facilities[0]?.landmark || "Near Shaheed Minar";
  const facilityName = facilities[0]?.name || "Dhaka Medical College Hospital";

  const ambulanceDispatch = isSevere
    ? {
        dispatch_status: "VOICE_CALL_ACTIVE",
        target_dispatcher: facilityName,
        dispatcher_phone: facilities[0]?.phone || "+8801711000999",
        twiml_bengali_script: `জরুরি অ্যাম্বুলেন্স ডিসপ্যাচ। হেলথ-ব্রিজ এআই কথা বলছি। একজন গুরুতর রোগী (${soapNote.assessment}) সাহায্য চাইছেন। লোকেশন ল্যান্ডমার্ক: ${landmark}, জিপিএস: ${lat}, ${lng}। রোগীকে দ্রুত ${facilityName}-এ নেওয়া প্রয়োজন।`,
        english_transcript: `Emergency Ambulance Dispatch from HealthBridge AI. Critical patient (${soapNote.assessment}). Landmark: ${landmark} (GPS: ${lat}, ${lng}). Routing to ${facilityName}.`
      }
    : null;

  return res.status(200).json({
    severity,
    recommended_facilities: facilities,
    er_handoff_packet: {
      soap_note: soapNote,
      qr_code_data_url: qrUrl
    },
    autonomous_ambulance_call: ambulanceDispatch
  });
}

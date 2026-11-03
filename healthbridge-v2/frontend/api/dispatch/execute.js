import { handleCors, checkRateLimit } from "../_cors.js";

const DHAKA_LANDMARKS = [
  { name: "Rampura / Hatirjheel Link Road", lat: 23.7662, lng: 90.4181 },
  { name: "Mohakhali / Wireless Gate", lat: 23.7780, lng: 90.4005 },
  { name: "Merul Badda / Pragati Sarani", lat: 23.7808, lng: 90.4267 },
  { name: "Banasree", lat: 23.7620, lng: 90.4350 },
  { name: "Gulshan-1 / Police Plaza", lat: 23.7785, lng: 90.4150 },
  { name: "Banani", lat: 23.7937, lng: 90.4040 },
  { name: "Khilgaon / Malibagh", lat: 23.7530, lng: 90.4190 },
  { name: "Farmgate / Tejgaon", lat: 23.7570, lng: 90.3875 },
  { name: "Dhanmondi", lat: 23.7460, lng: 90.3780 },
  { name: "Shahbagh / BSMMU", lat: 23.7385, lng: 90.3955 },
  { name: "Shaheed Minar / DU Campus", lat: 23.7258, lng: 90.3976 },
  { name: "Bakshibazar / DMCH Gate 2", lat: 23.7225, lng: 90.3960 },
  { name: "Uttara Sector 3", lat: 23.8680, lng: 90.3980 },
  { name: "Mirpur 10", lat: 23.8070, lng: 90.3685 },
];

function resolvePatientLandmark(pLat, pLng) {
  if (!pLat || !pLng) return "Central Dhaka";
  let best = DHAKA_LANDMARKS[0];
  let minD = Infinity;
  for (const lm of DHAKA_LANDMARKS) {
    const d = (lm.lat - pLat) ** 2 + (lm.lng - pLng) ** 2;
    if (d < minD) {
      minD = d;
      best = lm;
    }
  }
  return best.name;
}

function calcFacStats(pLat, pLng, fLat, fLng) {
  const dLat = (fLat - pLat) * 111;
  const dLng = (fLng - pLng) * 111 * Math.cos((pLat * Math.PI) / 180);
  const roadKm = Math.max(0.4, Math.sqrt(dLat * dLat + dLng * dLng) * 1.35);
  const etaMins = Math.max(2, Math.ceil((roadKm / 28) * 60));
  return {
    distance: roadKm < 1 ? `${Math.round(roadKm * 1000)} m` : `${roadKm.toFixed(1)} km`,
    eta: `${etaMins} mins`,
  };
}

export default async function handler(req, res) {
  if (handleCors(req, res, "GET, POST, OPTIONS", "Content-Type")) return;
  if (!checkRateLimit(req, res)) return;

  const {
    messages = [],
    severity = "Moderate",
    decision_flip_summary = "Clinical emergency evaluation",
    lat = 23.7771,
    lng = 90.3994,
    vitals = null,
    esi_level = null,
  } = req.body || {};

  const pLat = Number(lat) || 23.7771;
  const pLng = Number(lng) || 90.3994;

  const isSevere = String(severity).toLowerCase() === "severe";
  const esiText = esi_level ? `ESI Level ${esi_level}` : isSevere ? "ESI Level 2" : "ESI Level 4";
  const vitalsText = vitals
    ? `HR:${vitals.heartRate || 75} BP:${vitals.systolicBp || 120}/${vitals.diastolicBp || 80} SpO2:${vitals.spo2 || 98}%`
    : "Vitals Stable";

  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
  const symptomSummary = userMsgs.join(" | ") || "Acute symptoms presentation";

  // Calculate dynamic stats for facilities based on live patient coords
  const dmchStats = calcFacStats(pLat, pLng, 23.7250, 90.3975);
  const nicvdStats = calcFacStats(pLat, pLng, 23.7702, 90.3668);
  const bracStats = calcFacStats(pLat, pLng, 23.7780, 90.4005);
  const lazzStats = calcFacStats(pLat, pLng, 23.7665, 90.4202);

  const facilities = isSevere
    ? [
        {
          name: "Dhaka Medical College Hospital (Emergency Care Unit)",
          type: "Specialized Trauma & Cardiac ER",
          distance: dmchStats.distance,
          eta: dmchStats.eta,
          landmark: "Bakshibazar Gate 2",
          phone: "+8801711000999",
        },
        {
          name: "NICVD (National Institute of Cardiovascular Diseases)",
          type: "Cardiac Emergency ER",
          distance: nicvdStats.distance,
          eta: nicvdStats.eta,
          landmark: "Sher-e-Bangla Nagar, College Gate",
          phone: "+8801711000888",
        },
      ]
    : String(severity).toLowerCase() === "moderate"
    ? [
        {
          name: "Brac Healthcare Outpatient Clinic",
          type: "Primary Care Clinic",
          distance: bracStats.distance,
          eta: bracStats.eta,
          landmark: "Mohakhali Wireless Gate",
          phone: "+8809678191919",
        },
      ]
    : [
        {
          name: "Lazz Pharma (24/7 Registered Pharmacist)",
          type: "Local Pharmacy & ORS Station",
          distance: lazzStats.distance,
          eta: lazzStats.eta,
          landmark: "Rampura DIT Road",
          phone: "+8801700000111",
        },
      ];

  const soapNote = {
    protocol: "HealthBridge Zero-Wait ER Pre-Arrival Intake",
    triage_severity: String(severity).toUpperCase(),
    esi_level: esiText,
    subjective: `Patient reported: ${symptomSummary}`,
    objective: `Bilingual AI Triage completed. ${vitalsText}`,
    assessment: `Decision Flip Trigger: ${decision_flip_summary}`,
    plan: isSevere ? "Immediate ER Triage Bypass - Direct to Acute Bay" : "Outpatient / Local Clinic Review",
  };

  const qrData = encodeURIComponent(JSON.stringify(soapNote));
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;

  const patientLandmark = resolvePatientLandmark(pLat, pLng);
  const facilityName = facilities[0]?.name || "Dhaka Medical College Hospital";

  const ambulanceDispatch = isSevere
    ? {
        dispatch_status: "VOICE_CALL_ACTIVE",
        target_dispatcher: facilityName,
        dispatcher_phone: facilities[0]?.phone || "+8801711000999",
        twiml_bengali_script: `জরুরি অ্যাম্বুলেন্স ডিসপ্যাচ। হেলথ-ব্রিজ এআই কথা বলছি। একজন গুরুতর রোগী (${soapNote.assessment}) সাহায্য চাইছেন। লোকেশন ল্যান্ডমার্ক: ${patientLandmark}, জিপিএস: ${pLat.toFixed(4)}, ${pLng.toFixed(4)}। রোগীকে দ্রুত ${facilityName}-এ নেওয়া প্রয়োজন।`,
        english_transcript: `Emergency Ambulance Dispatch from HealthBridge AI. Critical patient (${soapNote.assessment}). Landmark: ${patientLandmark} (GPS: ${pLat.toFixed(4)}, ${pLng.toFixed(4)}). Routing to ${facilityName}.`,
      }
    : null;

  return res.status(200).json({
    severity,
    recommended_facilities: facilities,
    er_handoff_packet: {
      soap_note: soapNote,
      qr_code_data_url: qrUrl,
    },
    autonomous_ambulance_call: ambulanceDispatch,
  });
}

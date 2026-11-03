/**
 * Standardized Royal College of Physicians NEWS2 (National Early Warning Score)
 * and Emergency Severity Index (ESI Levels 1-5) calculation engine.
 */

export function calculateNews2({
  respiratoryRate = 16,
  spo2 = 98,
  systolicBp = 120,
  heartRate = 75,
  tempCelsius = 37.0,
  avpu = "Alert",
  onSupplementalO2 = false
}) {
  let score = 0;
  const breakdown = {};

  // 1. Respiration Rate (breaths/min)
  let rrScore = 0;
  if (respiratoryRate <= 8) rrScore = 3;
  else if (respiratoryRate <= 11) rrScore = 1;
  else if (respiratoryRate <= 20) rrScore = 0;
  else if (respiratoryRate <= 24) rrScore = 2;
  else rrScore = 3;
  score += rrScore;
  breakdown.respiratoryRate = rrScore;

  // 2. SpO2 Oxygen Saturation
  let spo2Score = 0;
  if (spo2 <= 91) spo2Score = 3;
  else if (spo2 <= 93) spo2Score = 2;
  else if (spo2 <= 95) spo2Score = 1;
  else spo2Score = 0;
  score += spo2Score;
  breakdown.spo2 = spo2Score;

  // 3. Supplemental Oxygen
  const o2Score = onSupplementalO2 ? 2 : 0;
  score += o2Score;
  breakdown.supplementalO2 = o2Score;

  // 4. Systolic Blood Pressure (mmHg)
  let sbpScore = 0;
  if (systolicBp <= 90) sbpScore = 3;
  else if (systolicBp <= 100) sbpScore = 2;
  else if (systolicBp <= 110) sbpScore = 1;
  else if (systolicBp <= 219) sbpScore = 0;
  else sbpScore = 3;
  score += sbpScore;
  breakdown.systolicBp = sbpScore;

  // 5. Heart Rate (bpm)
  let hrScore = 0;
  if (heartRate <= 40) hrScore = 3;
  else if (heartRate <= 50) hrScore = 1;
  else if (heartRate <= 90) hrScore = 0;
  else if (heartRate <= 110) hrScore = 1;
  else if (heartRate <= 130) hrScore = 2;
  else hrScore = 3;
  score += hrScore;
  breakdown.heartRate = hrScore;

  // 6. AVPU Consciousness
  const avpuClean = (avpu || "Alert").toUpperCase();
  const avpuScore = avpuClean === "ALERT" ? 0 : 3;
  score += avpuScore;
  breakdown.avpu = avpuScore;

  // 7. Temperature (°C)
  let tempScore = 0;
  if (tempCelsius <= 35.0) tempScore = 3;
  else if (tempCelsius <= 36.0) tempScore = 1;
  else if (tempCelsius <= 38.0) tempScore = 0;
  else if (tempCelsius <= 39.0) tempScore = 1;
  else tempScore = 2;
  score += tempScore;
  breakdown.temperature = tempScore;

  const hasExtremeSingle = [rrScore, spo2Score, sbpScore, hrScore, tempScore, avpuScore].some(s => s >= 3);

  let riskLevel = "Low";
  let clinicalUrgency = "Routine Outpatient / Local Pharmacy";
  let color = "emerald";

  if (score >= 7) {
    riskLevel = "High";
    clinicalUrgency = "Emergency Immediate Resuscitation / Acute Bay Transfer";
    color = "red";
  } else if (score >= 5 || hasExtremeSingle) {
    riskLevel = "Medium";
    clinicalUrgency = "Urgent Medical Review Needed";
    color = "amber";
  }

  return {
    score,
    riskLevel,
    clinicalUrgency,
    color,
    breakdown
  };
}

export function calculateEsi({
  news2Score = 0,
  avpu = "Alert",
  spo2 = 98,
  painLevel = 0,
  hasHighRiskSymptom = false,
  isLifeThreatening = false
}) {
  const avpuClean = (avpu || "Alert").toUpperCase();

  // ESI 1: Immediate life-saving intervention needed
  if (isLifeThreatening || avpuClean === "UNRESPONSIVE" || spo2 < 85) {
    return {
      level: 1,
      name: "ESI Level 1 (Resuscitation)",
      target: "Immediate Resus Bay / Airway Support",
      color: "red-600",
      description: "Critical life threat. Requires immediate physician and nurse intervention."
    };
  }

  // ESI 2: High risk / emergent / severe pain
  if (hasHighRiskSymptom || news2Score >= 7 || painLevel >= 8 || ["VOICE", "PAIN", "CONFUSION"].includes(avpuClean)) {
    return {
      level: 2,
      name: "ESI Level 2 (Emergent)",
      target: "Direct Acute Bedding (< 10 mins)",
      color: "orange-500",
      description: "High risk situation, acute chest pain/stroke red flags, or severe vital signs derangement."
    };
  }

  // ESI 3: Urgent (multiple resources)
  if (news2Score >= 5 || painLevel >= 5) {
    return {
      level: 3,
      name: "ESI Level 3 (Urgent)",
      target: "Urgent Care Bay (< 30 mins)",
      color: "amber-500",
      description: "Stable vitals but moderate acute symptoms requiring diagnostics/IV line."
    };
  }

  // ESI 4: Less urgent (one resource)
  if (painLevel >= 1 || news2Score >= 2) {
    return {
      level: 4,
      name: "ESI Level 4 (Less Urgent)",
      target: "Primary Clinic / Ambulatory (< 60 mins)",
      color: "blue-500",
      description: "Simple laceration, localized mild trauma, routine primary review."
    };
  }

  // ESI 5: Non-urgent
  return {
    level: 5,
    name: "ESI Level 5 (Non-urgent)",
    target: "Local Pharmacy / Self-Care Advice",
    color: "emerald-500",
    description: "Prescription refill, minor rash, or mild chronic presentation without acute red flags."
  };
}

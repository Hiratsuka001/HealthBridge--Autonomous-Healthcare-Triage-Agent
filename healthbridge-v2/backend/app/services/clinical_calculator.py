"""
Clinical calculation service for HealthBridge.
Implements standardized Royal College of Physicians NEWS2 (National Early Warning Score)
and Emergency Severity Index (ESI Levels 1-5).
"""

from typing import Dict, Any, Optional

def calculate_news2(
    respiratory_rate: int = 16,
    spo2: int = 98,
    systolic_bp: int = 120,
    heart_rate: int = 75,
    temp_celsius: float = 37.0,
    avpu: str = "Alert",
    on_supplemental_o2: bool = False
) -> Dict[str, Any]:
    score = 0
    breakdown = {}

    # 1. Respiration Rate (breaths/min)
    if respiratory_rate <= 8:
        rr_score = 3
    elif 9 <= respiratory_rate <= 11:
        rr_score = 1
    elif 12 <= respiratory_rate <= 20:
        rr_score = 0
    elif 21 <= respiratory_rate <= 24:
        rr_score = 2
    else:  # >= 25
        rr_score = 3
    score += rr_score
    breakdown["respiratory_rate"] = rr_score

    # 2. SpO2
    if spo2 <= 91:
        spo2_score = 3
    elif 92 <= spo2 <= 93:
        spo2_score = 2
    elif 94 <= spo2 <= 95:
        spo2_score = 1
    else:  # >= 96
        spo2_score = 0
    score += spo2_score
    breakdown["spo2"] = spo2_score

    # 3. Supplemental Oxygen
    o2_score = 2 if on_supplemental_o2 else 0
    score += o2_score
    breakdown["supplemental_o2"] = o2_score

    # 4. Systolic BP
    if systolic_bp <= 90:
        sbp_score = 3
    elif 91 <= systolic_bp <= 100:
        sbp_score = 2
    elif 101 <= systolic_bp <= 110:
        sbp_score = 1
    elif 111 <= systolic_bp <= 219:
        sbp_score = 0
    else:  # >= 220
        sbp_score = 3
    score += sbp_score
    breakdown["systolic_bp"] = sbp_score

    # 5. Heart Rate
    if heart_rate <= 40:
        hr_score = 3
    elif 41 <= heart_rate <= 50:
        hr_score = 1
    elif 51 <= heart_rate <= 90:
        hr_score = 0
    elif 91 <= heart_rate <= 110:
        hr_score = 1
    elif 111 <= heart_rate <= 130:
        hr_score = 2
    else:  # >= 131
        hr_score = 3
    score += hr_score
    breakdown["heart_rate"] = hr_score

    # 6. AVPU Consciousness
    avpu_clean = (avpu or "Alert").strip().upper()
    if avpu_clean == "ALERT":
        avpu_score = 0
    else:
        avpu_score = 3
    score += avpu_score
    breakdown["avpu"] = avpu_score

    # 7. Temperature
    if temp_celsius <= 35.0:
        temp_score = 3
    elif 35.1 <= temp_celsius <= 36.0:
        temp_score = 1
    elif 36.1 <= temp_celsius <= 38.0:
        temp_score = 0
    elif 38.1 <= temp_celsius <= 39.0:
        temp_score = 1
    else:  # >= 39.1
        temp_score = 2
    score += temp_score
    breakdown["temperature"] = temp_score

    has_extreme_single = any(
        s >= 3 for s in [rr_score, spo2_score, sbp_score, hr_score, temp_score, avpu_score]
    )

    if score >= 7:
        risk_level = "High"
        clinical_urgency = "High Clinical Urgency - Immediate Resuscitation / ER Transfer"
    elif score >= 5 or has_extreme_single:
        risk_level = "Medium"
        clinical_urgency = "Medium Clinical Urgency - Urgent Clinical Review"
    else:
        risk_level = "Low"
        clinical_urgency = "Low Clinical Urgency - Outpatient / Ward Assessment"

    return {
        "score": score,
        "risk_level": risk_level,
        "clinical_urgency": clinical_urgency,
        "breakdown": breakdown
    }

def calculate_esi(
    news2_score: int,
    avpu: str = "Alert",
    spo2: int = 98,
    pain_level: int = 0,
    has_high_risk_symptom: bool = False,
    is_life_threatening: bool = False
) -> int:
    """
    Emergency Severity Index (1 to 5):
    1: Immediate life-saving intervention needed
    2: High risk / emergent / severe pain
    3: Urgent (multiple resources)
    4: Less urgent (one resource)
    5: Non-urgent
    """
    avpu_clean = (avpu or "Alert").strip().upper()
    if is_life_threatening or avpu_clean == "UNRESPONSIVE" or spo2 < 85:
        return 1

    if has_high_risk_symptom or news2_score >= 7 or pain_level >= 8 or avpu_clean in ["VOICE", "PAIN", "CONFUSION"]:
        return 2

    if news2_score >= 5 or pain_level >= 5:
        return 3

    if pain_level >= 1 or news2_score >= 2:
        return 4

    return 5

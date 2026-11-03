export const PRESETS = {
  normal: {
    label: "Normal Baseline",
    icon: "🟢",
    vitals: {
      heartRate: 75,
      systolicBp: 120,
      diastolicBp: 80,
      spo2: 98,
      respiratoryRate: 16,
      tempCelsius: 37.0,
      avpu: "Alert",
      painLevel: 1,
      onSupplementalO2: false
    }
  },
  dehydration: {
    label: "Heat Exhaustion",
    icon: "🟡",
    vitals: {
      heartRate: 104,
      systolicBp: 105,
      diastolicBp: 68,
      spo2: 97,
      respiratoryRate: 20,
      tempCelsius: 38.3,
      avpu: "Alert",
      painLevel: 3,
      onSupplementalO2: false
    }
  },
  cardiac: {
    label: "Acute Cardiac Crisis",
    icon: "🔴",
    vitals: {
      heartRate: 118,
      systolicBp: 165,
      diastolicBp: 102,
      spo2: 94,
      respiratoryRate: 24,
      tempCelsius: 37.2,
      avpu: "Alert",
      painLevel: 9,
      onSupplementalO2: false
    }
  },
  septic: {
    label: "Septic Shock / Hypoxia",
    icon: "🚨",
    vitals: {
      heartRate: 134,
      systolicBp: 84,
      diastolicBp: 52,
      spo2: 89,
      respiratoryRate: 28,
      tempCelsius: 39.5,
      avpu: "Voice",
      painLevel: 7,
      onSupplementalO2: true
    }
  }
};

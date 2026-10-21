const API_BASE = "http://localhost:8000/api";

export async function sendTriageMessage(messages, visualContext = "") {
  const res = await fetch(`${API_BASE}/triage/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, visual_context: visualContext }),
  });
  return res.json();
}

export async function uploadSymptomImage(file, symptomHint = "wound, burn, rash, or prescription") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("symptom_hint", symptomHint);

  const res = await fetch(`${API_BASE}/triage/vision`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function executeDispatch(messages, severity, decisionFlipSummary) {
  const res = await fetch(`${API_BASE}/dispatch/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      severity,
      decision_flip_summary: decisionFlipSummary,
      lat: 23.7771,
      lng: 90.3994,
    }),
  });
  return res.json();
}


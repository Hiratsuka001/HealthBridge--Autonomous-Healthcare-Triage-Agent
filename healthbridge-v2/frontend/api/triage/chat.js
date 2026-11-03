export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages = [], visual_context = "", vitals = null } = req.body || {};
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || "https://api.meta.ai/v1";
  const model = process.env.LLM_MODEL || "muse-spark-1.3";

  if (!apiKey || apiKey === "mock-key" || apiKey === "your_meta_hackathon_key_here") {
    return res.status(200).json({
      decision_flip_test: {
        missing_critical_info: "Red flags ruled out (mock mode active).",
        has_verified_info: true,
        should_escalate: false
      },
      current_severity: "Mild",
      next_question: null,
      is_triage_complete: true,
      clinical_rationale: "Offline mock mode."
    });
  }

  try {
    const systemPrompt = `You are HealthBridge, an autonomous bilingual (Bengali/English) emergency triage agent.
Conduct a dynamic, one-question-at-a-time clinical interview grounded in WHO emergency triage protocols.

CRITICAL INSTRUCTIONS:
1. Select the SINGLE next question most likely to change the safe clinical outcome.
2. Execute the Decision Flip Test in your structured output:
   - What unasked information could flip the recommended urgency?
   - Has the system explicitly verified that information?
   - Safety Guardrail: If a critical variable remains unknown or ambiguous, default to escalating care rather than offering false reassurance.
3. Speak to the patient in the language they used last (Bengali or English).${visual_context ? `\n\nSAM 3.1 VISUAL SYMPTOM CONTEXT:\n${visual_context}` : ""}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Meta API Error] ${response.status}: ${errText}`);
      throw new Error(`Meta API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    const parsed = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;

    // Normalize property names in case the LLM used alternate keys
    if (parsed.decision_flip_test) {
      if (!parsed.decision_flip_test.missing_critical_info) {
        parsed.decision_flip_test.missing_critical_info =
          parsed.decision_flip_test.unasked_info_that_could_flip_urgency ||
          parsed.decision_flip_test.missing_info ||
          "Head trauma, loss of consciousness, or systemic danger signs";
      }
      if (parsed.decision_flip_test.has_verified_info === undefined) {
        parsed.decision_flip_test.has_verified_info = false;
      }
      if (parsed.decision_flip_test.should_escalate === undefined) {
        parsed.decision_flip_test.should_escalate = true;
      }
    }

    if (!parsed.current_severity) {
      parsed.current_severity = "Moderate";
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("[Vercel Triage Serverless Error]", err);
    return res.status(500).json({ error: err.message });
  }
}

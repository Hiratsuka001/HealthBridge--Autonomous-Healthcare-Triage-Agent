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
3. Speak to the patient in the language they used last (Bengali or English).
4. You MUST respond with a JSON object strictly following this structure:
{
  "next_question": "Your single next clinical question in patient's language, or null if triage is complete",
  "current_severity": "Mild" | "Moderate" | "Severe",
  "is_triage_complete": false | true,
  "decision_flip_test": {
    "missing_critical_info": "Critical unasked variable",
    "has_verified_info": false,
    "should_escalate": true
  }
}${visual_context ? `\n\nSAM 3.1 VISUAL SYMPTOM CONTEXT:\n${visual_context}` : ""}`;

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

    const userMsgs = messages.filter((m) => m.role === "user");
    const lastUserText = userMsgs[userMsgs.length - 1]?.content || "";
    const isBn = /[\u0980-\u09FF]/.test(lastUserText);

    // Normalize property names across any key variants the LLM chose
    const rawFlip = parsed.decision_flip_test || parsed.Decision_Flip_Test || {};
    parsed.decision_flip_test = {
      missing_critical_info:
        rawFlip.missing_critical_info ||
        rawFlip.unasked_info_that_could_flip_urgency ||
        rawFlip.missing_info ||
        "Chief complaint and emergency red-flag screening",
      has_verified_info: Boolean(rawFlip.has_verified_info || rawFlip.has_system_explicitly_verified),
      should_escalate: rawFlip.should_escalate !== undefined ? Boolean(rawFlip.should_escalate) : true
    };

    if (!parsed.current_severity) {
      parsed.current_severity = "Moderate";
    }

    // Extract next_question robustly
    let question =
      parsed.next_question ||
      parsed.question ||
      parsed.nextQuestion ||
      parsed.reply ||
      parsed.response ||
      parsed.message ||
      null;

    if (!question && !parsed.is_triage_complete) {
      if (parsed.next_question_rationale) {
        question = parsed.next_question_rationale;
      } else {
        question = isBn
          ? "হ্যালো! আমি হেলথব্রিজ জরুরি ট্রায়াজ সহকারী। আপনার বা রোগীর কী কী শারীরিক সমস্যা দেখা দিচ্ছে বিস্তারিত বলুন।"
          : "Hello! I am HealthBridge triage assistant. What medical symptoms or emergency are you experiencing?";
      }
    }
    parsed.next_question = question;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("[Vercel Triage Serverless Error]", err);
    return res.status(500).json({ error: err.message });
  }
}

import React, { useState } from "react";
import { sendTriageMessage, uploadSymptomImage, executeDispatch } from "../api";
import { ShieldAlert, Upload, PhoneCall, QrCode, MapPin, Send, Sparkles, CheckCircle2 } from "lucide-react";

export default function TriagePanel({ title = "Patient Triage Session", presetScenario = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [triageState, setTriageState] = useState(null);
  const [visualData, setVisualData] = useState(null);
  const [dispatchData, setDispatchData] = useState(null);

  const handleSend = async (customText = null) => {
    const textToSend = customText ?? input;
    if (!textToSend.trim()) return;

    const updatedMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(updatedMessages);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await sendTriageMessage(
        updatedMessages,
        visualData?.visual_severity_context || ""
      );
      setTriageState(res);

      if (res.next_question) {
        setMessages([...updatedMessages, { role: "assistant", content: res.next_question }]);
      }

      if (res.is_triage_complete) {
        const dispatchRes = await executeDispatch(
          updatedMessages,
          res.current_severity,
          res.decision_flip_test?.missing_critical_info || "Verified pathway"
        );
        setDispatchData(dispatchRes);
      }
    } catch (err) {
      console.error("Triage error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadSymptomImage(file);
      setVisualData(res);
    } catch (err) {
      console.error("Vision upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const severityBadge = (sev) => {
    if (sev === "Severe") return "bg-red-600 text-white";
    if (sev === "Moderate") return "bg-amber-500 text-slate-950";
    return "bg-emerald-600 text-white";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-lg text-white">{title}</h2>
          <p className="text-xs text-slate-400">Muse Spark + WHO Protocol RAG</p>
        </div>
        {triageState && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${severityBadge(triageState.current_severity)}`}>
            {triageState.current_severity.toUpperCase()}
          </span>
        )}
      </div>

      {/* Quick Demo Presets */}
      {presetScenario && messages.length === 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
          <span className="text-xs text-slate-400 font-medium">Quick Demo Triggers:</span>
          <div className="flex flex-wrap gap-2">
            {presetScenario.steps.map((step, i) => (
              <button
                key={i}
                onClick={() => handleSend(step.text)}
                className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-md transition"
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Decision Flip Test Live Inspector */}
      {triageState?.decision_flip_test && (
        <div className="bg-slate-950 border border-indigo-500/40 rounded-lg p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-indigo-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Decision Flip Test Engine
            </span>
            <span className={triageState.decision_flip_test.should_escalate ? "text-red-400" : "text-emerald-400"}>
              {triageState.decision_flip_test.should_escalate ? "GUARDRAIL: ESCALATE" : "GUARDRAIL: SAFE"}
            </span>
          </div>
          <p className="text-slate-300">
            <span className="text-slate-500">Unasked / Flip Factor:</span>{" "}
            {triageState.decision_flip_test.missing_critical_info}
          </p>
          <p className="text-slate-400">
            <span className="text-slate-500">Verified:</span>{" "}
            {triageState.decision_flip_test.has_verified_info ? "Yes" : "No (Asking now...)"}
          </p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center my-8">
            Describe symptoms in Bengali or English (e.g., "আমার মাথা ঘুরছে" / "I feel dizzy")
          </p>
        )}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg text-sm ${
              m.role === "user"
                ? "bg-indigo-600 text-white ml-8"
                : "bg-slate-800 text-slate-100 mr-8 border border-slate-700"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-xs text-indigo-400 animate-pulse">Running Decision Flip Test...</p>}
      </div>

      {/* SAM 3.1 + Muse Image Visual Triage Card */}
      {visualData && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-3 text-xs space-y-1.5">
          <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> SAM 3.1 Segmentation & Muse Image First-Aid
          </div>
          <p className="text-slate-300">{visualData.sam_segmentation?.detected_region}</p>
          <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-amber-200">
            <p className="font-medium">{visualData.first_aid_overlay?.instructions_bn}</p>
            <p className="text-slate-400 mt-1">{visualData.first_aid_overlay?.instructions_en}</p>
          </div>
        </div>
      )}

      {/* Input Row + SAM 3.1 Upload */}
      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs transition">
          <Upload className="w-4 h-4 text-indigo-400" />
          <span>SAM 3.1 Photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type symptoms in বাংলা or English..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => handleSend()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Dispatch & Zero-Wait ER Handoff Output */}
      {dispatchData && (
        <div className="mt-2 space-y-3 border-t border-slate-700 pt-3">
          {/* Autonomous Ambulance Voice Dispatch (For Severe Cases) */}
          {dispatchData.autonomous_ambulance_call && (
            <div className="bg-red-950/50 border border-red-500/60 rounded-lg p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <PhoneCall className="w-4 h-4 animate-bounce" />
                AUTONOMOUS BENGALI VOICE DISPATCH ACTIVE ({dispatchData.autonomous_ambulance_call.target_dispatcher})
              </div>
              <p className="text-white font-medium">
                "{dispatchData.autonomous_ambulance_call.twiml_bengali_script}"
              </p>
              <p className="text-slate-400 italic">
                {dispatchData.autonomous_ambulance_call.english_transcript}
              </p>
            </div>
          )}

          {/* Recommended Facilities + QR Code Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
              <div className="font-semibold text-indigo-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Smart Facility Routing
              </div>
              {dispatchData.recommended_facilities?.map((f, i) => (
                <div key={i} className="border-b border-slate-800 last:border-0 pb-1.5">
                  <p className="font-bold text-white">{f.name}</p>
                  <p className="text-slate-400">{f.type} • {f.distance} ({f.eta})</p>
                  <p className="text-amber-300/90">Landmark: {f.landmark}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs flex flex-col items-center justify-center text-center">
              <div className="font-semibold text-emerald-400 flex items-center gap-1 mb-2">
                <QrCode className="w-3.5 h-3.5" /> Zero-Wait ER SOAP QR
              </div>
              <img
                src={dispatchData.er_handoff_packet?.qr_code_data_url}
                alt="ER Soap Note QR"
                className="w-28 h-28 rounded border border-slate-700 bg-white p-1"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                {dispatchData.er_handoff_packet?.soap_note?.plan}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


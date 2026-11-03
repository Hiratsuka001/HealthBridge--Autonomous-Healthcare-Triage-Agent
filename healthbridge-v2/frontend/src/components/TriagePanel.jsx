import React, { useState, useEffect } from "react";
import { sendTriageMessage, uploadSymptomImage, executeDispatch } from "../api";
import { startVoiceRecognition, speakText } from "../utils/speech";
import BodyMap from "./BodyMap";
import VitalsBar from "./VitalsBar";
import FASTStrokeCard from "./FASTStrokeCard";
import {
  Upload,
  PhoneCall,
  QrCode,
  MapPin,
  Send,
  Sparkles,
  CheckCircle2,
  Mic,
  Volume2,
  Crosshair,
  Activity,
  Gauge,
  Brain,
  MessageSquare,
  RotateCcw,
} from "lucide-react";

export default function TriagePanel({
  title = "Patient Triage Session",
  presetScenario = null,
  initialRegion = "chest",
  onTriageComplete = null,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [triageState, setTriageState] = useState(null);
  const [visualData, setVisualData] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [dispatchData, setDispatchData] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState("bn-BD");
  const [coords, setCoords] = useState(null);

  // Active intake widget tab: 'bodymap' | 'vitals' | 'fast'
  const [activeWidgetTab, setActiveWidgetTab] = useState("bodymap");
  const [currentVitals, setCurrentVitals] = useState(null);
  const [currentScoring, setCurrentScoring] = useState(null);
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(initialRegion);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setTriageState(null);
    setVisualData(null);
    setImagePreviewUrl(null);
    setDispatchData(null);
    setActiveWidgetTab("bodymap");
  };

  const handleSend = async (customText = null, _customSeverityTrigger = false) => {
    const textToSend = customText ?? input;
    if (!textToSend.trim()) return;

    const updatedMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(updatedMessages);
    if (!customText) setInput("");
    setLoading(true);

    try {
      const res = await sendTriageMessage(
        updatedMessages,
        visualData?.visual_severity_context || "",
        currentVitals,
        selectedBodyRegion
      );
      setTriageState(res);

      if (res.next_question) {
        setMessages([...updatedMessages, { role: "assistant", content: res.next_question }]);
      } else if (res.is_triage_complete) {
        const completionMsg =
          res.current_severity === "Severe"
            ? "⚠️ জরুরি সতর্কতা: ট্রায়াজ সম্পন্ন হয়েছে (Severe)। অ্যাম্বুলেন্স ডিসপ্যাচ ও ইমার্জেন্সি রিপোর্ট নিচে তৈরি করা হয়েছে। / Emergency: Severe case detected. Immediate dispatch initiated below."
            : `✅ ট্রায়াজ সম্পন্ন হয়েছে (${res.current_severity})। নিকটস্থ সেবা কেন্দ্র ও ব্যবস্থাপত্র নিচে দেখুন। / Triage complete (${res.current_severity}). Facility recommendations generated below.`;
        setMessages([...updatedMessages, { role: "assistant", content: completionMsg }]);
      }

      if (res.is_triage_complete) {
        const esiLvl = res.esi_level || currentScoring?.esi?.level || (res.current_severity === "Severe" ? 2 : 4);
        const dispatchRes = await executeDispatch(
          updatedMessages,
          res.current_severity,
          res.decision_flip_test?.missing_critical_info || "Verified clinical pathway",
          coords,
          currentVitals,
          esiLvl
        );
        setDispatchData(dispatchRes);

        if (dispatchRes.autonomous_ambulance_call?.twiml_bengali_script) {
          speakText(dispatchRes.autonomous_ambulance_call.twiml_bengali_script, "bn-BD");
        }

        // Notify parent callback for Hospital ER sync
        if (onTriageComplete) {
          const userMsgs = updatedMessages.filter((m) => m.role === "user");
          onTriageComplete({
            patientId: "HB-" + Math.floor(1000 + Math.random() * 9000),
            etaMinutes: res.current_severity === "Severe" ? 7 : 18,
            chiefComplaint: userMsgs[userMsgs.length - 1]?.content || "Acute clinical symptoms",
            chiefComplaintBn: userMsgs[0]?.content || "অসুস্থতা অনুভব করছেন",
            severity: res.current_severity,
            esiLevel: esiLvl,
            news2Score: res.news2_score || currentScoring?.news?.score || (res.current_severity === "Severe" ? 7 : 1),
            vitals: currentVitals || {
              heartRate: 118,
              systolicBp: 160,
              diastolicBp: 95,
              spo2: 94,
              respiratoryRate: 24,
              tempCelsius: 37.2,
              avpu: "Alert",
              painLevel: 8,
            },
            decisionFlipTrigger: res.decision_flip_test?.missing_critical_info || "Verified clinical pathway",
            assignedBay: res.current_severity === "Severe" ? "Resuscitation Bay 2" : "Acute Bay 4",
            dispatcher: dispatchRes.autonomous_ambulance_call?.target_dispatcher || "Dhaka Medical College Hospital",
            ambulanceId: "AMB-DH-304",
            landmark: "Near Shaheed Minar / Bakshibazar Gate",
            timeReported: "Just now",
          });
        }
      }
    } catch (err) {
      console.error("Triage error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomSelectFromMap = (symptom) => {
    setSelectedBodyRegion(symptom.regionName);
    const formatted = `[Anatomy: ${symptom.regionName}] ${symptom.textBn} (${symptom.textEn})`;
    handleSend(formatted, symptom.isSevere);
  };

  const handleStrokeEscalation = ({ summaryBn, summaryEn }) => {
    const formatted = `[STROKE FAST PROTOCOL POSITIVE] ${summaryBn} | ${summaryEn}`;
    handleSend(formatted, true);
  };

  const handleVitalsChange = (vitals, scoring) => {
    setCurrentVitals(vitals);
    setCurrentScoring(scoring);
  };

  const handleVoiceInput = () => {
    if (isListening) return;
    setIsListening(true);
    startVoiceRecognition(
      voiceLang,
      (transcript) => {
        setInput(transcript);
        handleSend(transcript);
      },
      () => setIsListening(false)
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreviewUrl(URL.createObjectURL(file));
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

  const currentEsi = triageState?.esi_level ?? currentScoring?.esi?.level ?? 3;
  const currentNews = triageState?.news2_score ?? currentScoring?.news?.score ?? 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="font-bold text-lg text-white flex items-center gap-2">
            {title}
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
              WHO RAG + ESI + NEWS2
            </span>
          </h2>
          <p className="text-xs text-slate-400">Autonomous Prehospital Tele-Triage & Emergency Handoff</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live ESI Badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
            ESI Level {currentEsi}
          </span>

          {/* Live NEWS2 Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              currentNews >= 7
                ? "bg-red-950/80 text-red-300 border-red-500/50"
                : currentNews >= 5
                ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
            }`}
          >
            NEWS2: {currentNews}
          </span>

          {triageState && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${severityBadge(triageState.current_severity)}`}>
              {triageState.current_severity.toUpperCase()}
            </span>
          )}

          {(triageState || messages.length > 0) && (
            <button
              onClick={handleReset}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition flex items-center gap-1"
              title="Reset session"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Clinical Intake Station */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Intake Widget Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setActiveWidgetTab("bodymap")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition shrink-0 ${
                activeWidgetTab === "bodymap"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Interactive Body Map
            </button>

            <button
              onClick={() => setActiveWidgetTab("vitals")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition shrink-0 ${
                activeWidgetTab === "vitals"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Gauge className="w-3.5 h-3.5" /> Clinical Vitals & Risk Score
            </button>

            <button
              onClick={() => setActiveWidgetTab("fast")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition shrink-0 ${
                activeWidgetTab === "fast"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> FAST Stroke Check
            </button>
          </div>

          {/* Active Intake Widget */}
          {activeWidgetTab === "bodymap" && (
            <BodyMap onSelectSymptom={handleSymptomSelectFromMap} activeRegionId={initialRegion} />
          )}

          {activeWidgetTab === "vitals" && (
            <VitalsBar
              onVitalsChange={handleVitalsChange}
              hasHighRiskSymptom={triageState?.current_severity === "Severe"}
            />
          )}

          {activeWidgetTab === "fast" && (
            <FASTStrokeCard onTriggerStrokeEscalation={handleStrokeEscalation} />
          )}

          {/* Quick Demo Presets */}
          {presetScenario && !triageState?.is_triage_complete && !loading && (() => {
            const stepIdx = Math.floor(messages.length / 2);
            const step = presetScenario.steps[stepIdx];
            if (!step) return null;
            return (
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex flex-col gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  Quick Demo Trigger (Step {stepIdx + 1} of {presetScenario.steps.length}):
                </span>
                <button
                  onClick={() => handleSend(step.text)}
                  className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 px-3 py-1.5 rounded-md transition text-left"
                >
                  {step.label}
                </button>
              </div>
            );
          })()}
        </div>

        {/* Right Column (5 cols): Autonomous Triage Agent & Dispatch */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Decision Flip Test Live Inspector */}
          {triageState?.decision_flip_test && (
            <div className="bg-slate-950 border border-indigo-500/40 rounded-lg p-3 text-xs space-y-1.5 shadow">
              <div className="flex items-center justify-between text-indigo-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Decision Flip Test Engine
                </span>
                <span
                  className={
                    triageState.decision_flip_test.should_escalate
                      ? "text-red-400 font-bold"
                      : "text-emerald-400 font-bold"
                  }
                >
                  {triageState.decision_flip_test.should_escalate
                    ? "GUARDRAIL: ESCALATE (SEVERE)"
                    : "GUARDRAIL: SAFE TO PROCEED"}
                </span>
              </div>
              <p className="text-slate-300">
                <span className="text-slate-500 font-medium">Unasked / Flip Trigger:</span>{" "}
                {triageState.decision_flip_test.missing_critical_info}
              </p>
              <div className="flex items-center justify-between text-slate-400 pt-0.5">
                <span>
                  <span className="text-slate-500">Verified by Agent:</span>{" "}
                  {triageState.decision_flip_test.has_verified_info ? "Yes" : "No (Verifying in progress...)"}
                </span>
                {triageState.clinical_rationale && (
                  <span className="text-indigo-300/90 italic font-mono text-[11px]">
                    {triageState.clinical_rationale}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 shadow">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Triage Dialogue & Protocol Q&A
              </span>
              {messages.length > 0 && (
                <span className="text-[10px] text-slate-500">{messages.length} messages</span>
              )}
            </div>

            <div className="min-h-[160px] max-h-[220px] overflow-y-auto space-y-2.5 pr-1">
              {messages.length === 0 && (
                <div className="text-xs text-slate-500 italic text-center py-8">
                  Use the <strong className="text-slate-400">Body Map</strong> or{" "}
                  <strong className="text-slate-400">Vitals</strong> on the left, or speak/type below to begin.
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white ml-8 shadow-sm"
                      : "bg-slate-800/90 text-slate-100 mr-8 border border-slate-700"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <p className="text-xs text-indigo-400 animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> Evaluating Decision Flip & WHO Triage Protocol...
                </p>
              )}
            </div>
          </div>

          {/* SAM 3.1 + Muse Image Visual Triage Card */}
          {visualData && (
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-3 text-xs space-y-2 shadow">
              <div className="font-semibold text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> SAM 3.1 Segmentation & Muse Image First-Aid
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                  Mask Confidence: {Math.round((visualData.sam_segmentation?.confidence || 0.94) * 100)}%
                </span>
              </div>

              {imagePreviewUrl && (
                <div className="relative w-full h-32 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img src={imagePreviewUrl} alt="Uploaded symptom" className="max-h-full object-contain opacity-90" />
                  <div className="absolute inset-4 border-2 border-dashed border-emerald-400 bg-emerald-500/15 rounded-lg flex flex-col items-center justify-center pointer-events-none">
                    <Crosshair className="w-4 h-4 text-emerald-300 animate-spin" />
                    <span className="text-[9px] font-bold bg-slate-950/90 text-emerald-300 px-2 py-0.5 rounded mt-1">
                      SAM 3.1 ROI ISOLATED • COOL WITH WATER
                    </span>
                  </div>
                </div>
              )}

              <p className="text-slate-300">{visualData.sam_segmentation?.detected_region}</p>
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-amber-200">
                <p className="font-medium">{visualData.first_aid_overlay?.instructions_bn}</p>
                <p className="text-slate-400 mt-0.5">{visualData.first_aid_overlay?.instructions_en}</p>
              </div>
            </div>
          )}

          {/* Input Row + SAM 3.1 Upload + Bilingual Voice Mic */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-2 rounded-lg flex items-center gap-1.5 text-xs transition">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>SAM 3.1</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            {/* Voice Language Toggle + Mic Button */}
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setVoiceLang(voiceLang === "bn-BD" ? "en-US" : "bn-BD")}
                className="text-[11px] px-2 py-2 bg-slate-900 text-indigo-300 font-bold border-r border-slate-700 hover:bg-slate-950 transition"
                title="Switch Voice Language"
              >
                {voiceLang === "bn-BD" ? "বাংলা" : "EN"}
              </button>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`px-2.5 py-2 flex items-center gap-1 text-xs transition ${
                  isListening ? "bg-red-600 text-white animate-pulse" : "text-slate-200 hover:bg-slate-700"
                }`}
                title="Speak Symptoms"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !triageState?.is_triage_complete && handleSend()}
              placeholder={
                triageState?.is_triage_complete
                  ? "Triage complete / ট্রায়াজ সম্পন্ন (Reset to start over)"
                  : "Speak or type in বাংলা / English..."
              }
              disabled={loading || triageState?.is_triage_complete}
              className="flex-1 min-w-[140px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || triageState?.is_triage_complete}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Dispatch & Zero-Wait ER Handoff Output */}
          {dispatchData && (
            <div className="mt-2 space-y-3 border-t border-slate-700 pt-3">
              {/* Autonomous Ambulance Voice Dispatch */}
              {dispatchData.autonomous_ambulance_call && (
                <div className="bg-red-950/50 border border-red-500/60 rounded-lg p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <PhoneCall className="w-4 h-4 animate-bounce" />
                      AUTONOMOUS BENGALI VOICE DISPATCH ({dispatchData.autonomous_ambulance_call.target_dispatcher})
                    </div>
                    <button
                      onClick={() => speakText(dispatchData.autonomous_ambulance_call.twiml_bengali_script, "bn-BD")}
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded text-[11px] font-medium transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Replay Voice Call
                    </button>
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
                  <div className="font-semibold text-indigo-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Smart Facility Routing
                    </span>
                    {coords && (
                      <span className="text-[10px] text-emerald-400 font-normal">
                        GPS: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
                      </span>
                    )}
                  </div>
                  {dispatchData.recommended_facilities?.map((f, i) => (
                    <div key={i} className="border-b border-slate-800 last:border-0 pb-1.5">
                      <p className="font-bold text-white">{f.name}</p>
                      <p className="text-slate-400">
                        {f.type} • {f.distance} ({f.eta})
                      </p>
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
                    className="w-24 h-24 rounded border border-slate-700 bg-white p-1"
                  />
                  <p className="text-[11px] text-indigo-300 font-mono mt-1">
                    {dispatchData.er_handoff_packet?.soap_note?.esi_level || `ESI Level ${currentEsi}`}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {dispatchData.er_handoff_packet?.soap_note?.plan}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

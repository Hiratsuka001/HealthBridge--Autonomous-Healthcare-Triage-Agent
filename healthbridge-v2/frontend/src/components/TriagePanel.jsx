import React, { useState, useEffect } from "react";
import { sendTriageMessage, uploadSymptomImage, executeDispatch } from "../api";
import { startVoiceRecognition, speakText } from "../utils/speech";
import BodyMap from "./BodyMap";
import VitalsBar from "./VitalsBar";
import FASTStrokeCard from "./FASTStrokeCard";
import DispatchMap from "./DispatchMap";
import MedicineScanner from "./MedicineScanner";
import {
  Upload,
  PhoneCall,
  QrCode,
  MapPin,
  Send,
  CheckCircle2,
  Mic,
  Volume2,
  Crosshair,
  Activity,
  Gauge,
  Brain,
  MessageSquare,
  RotateCcw,
  Navigation,
  Pill,
  ShieldCheck,
} from "lucide-react";

export default function TriagePanel({
  title = null,
  presetScenario = null,
  initialRegion = "chest",
  onTriageComplete = null,
  lang = "bn",
}) {
  const isBn = lang === "bn";
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [triageState, setTriageState] = useState(null);
  const [visualData, setVisualData] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [dispatchData, setDispatchData] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceLangOverride, setVoiceLangOverride] = useState(null);
  const voiceLang = voiceLangOverride ?? (lang === "bn" ? "bn-BD" : "en-US");
  const [coords, setCoords] = useState(null);

  // Active intake widget tab: 'bodymap' | 'vitals' | 'fast' | 'map' | 'meds'
  const [activeWidgetTab, setActiveWidgetTab] = useState("bodymap");
  const [currentVitals, setCurrentVitals] = useState(null);
  const [currentScoring, setCurrentScoring] = useState(null);
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(initialRegion);
  const [scannedMedications, setScannedMedications] = useState([]);

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
    setScannedMedications([]);
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
            ? isBn
              ? "⚠️ জরুরি সতর্কতা: ট্রায়াজ সম্পন্ন হয়েছে (Severe)। জরুরি অ্যাম্বুলেন্স ডিসপ্যাচ ও হাসপাতাল ইমার্জেন্সি রিপোর্ট নিচে তৈরি করা হয়েছে।"
              : "⚠️ Emergency: Severe case detected. Immediate dispatch initiated below."
            : isBn
            ? `✅ ট্রায়াজ সম্পন্ন হয়েছে (${res.current_severity})। নিকটস্থ সেবা কেন্দ্র ও পরামর্শ নিচে দেওয়া হলো।`
            : `✅ Triage complete (${res.current_severity}). Facility recommendations generated below.`;
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
            medications: scannedMedications,
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
    if (sev === "Moderate") return "bg-amber-500 text-slate-900";
    return "bg-emerald-600 text-white";
  };

  const currentEsi = triageState?.esi_level ?? currentScoring?.esi?.level ?? 3;
  const currentNews = triageState?.news2_score ?? currentScoring?.news?.score ?? 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 flex flex-col gap-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <span>
              {title || (isBn ? "ক্লিনিক্যাল ট্রায়াজ ও জরুরি ইনটেক" : "Clinical Triage & Emergency Intake")}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
              WHO Protocol
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? "ডব্লিউএইচও স্ট্যান্ডার্ড ট্রায়াজ • সরাসরি জরুরি ডিসপ্যাচ ও হাসপাতাল প্রস্তুতি"
              : "Standard Emergency Triage • Direct Dispatch & Hospital ER Handoff"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live ESI Badge */}
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-xs">
            ESI Level {currentEsi}
          </span>

          {/* Live NEWS2 Badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-xs ${
              currentNews >= 7
                ? "bg-red-50 text-red-800 border-red-200"
                : currentNews >= 5
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            NEWS2: {currentNews}
          </span>

          {triageState && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs ${severityBadge(triageState.current_severity)}`}>
              {triageState.current_severity.toUpperCase()}
            </span>
          )}

          {(triageState || messages.length > 0) && (
            <button
              onClick={handleReset}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 transition flex items-center gap-1 font-semibold"
              title="Reset session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isBn ? "রিসেট" : "Reset"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Clinical Intake Station */}
        <div className="lg:col-span-7 space-y-4">
          {/* Intake Widget Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveWidgetTab("bodymap")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeWidgetTab === "bodymap"
                  ? "bg-white text-teal-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>{isBn ? "শারীরিক ম্যাপ" : "Body Map"}</span>
            </button>

            <button
              onClick={() => setActiveWidgetTab("vitals")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeWidgetTab === "vitals"
                  ? "bg-white text-teal-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-teal-600" />
              <span>{isBn ? "ভাইটাল ও রিস্ক" : "Vitals & Risk"}</span>
            </button>

            <button
              onClick={() => setActiveWidgetTab("fast")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeWidgetTab === "fast"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-red-700"
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-red-500" />
              <span>{isBn ? "স্ট্রোক স্ক্রিন" : "FAST Stroke"}</span>
            </button>

            <button
              onClick={() => setActiveWidgetTab("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeWidgetTab === "map"
                  ? "bg-white text-teal-800 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              <span>{isBn ? "ডিসপ্যাচ ম্যাপ" : "Dispatch Map"}</span>
            </button>

            <button
              onClick={() => setActiveWidgetTab("meds")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeWidgetTab === "meds"
                  ? "bg-purple-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-purple-700"
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-purple-600" />
              <span>{isBn ? "ওষুধ নিরাপত্তা" : "Rx Safety"}</span>
              {scannedMedications.length > 0 && (
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 rounded-full font-bold">
                  {scannedMedications.length}
                </span>
              )}
            </button>
          </div>

          {/* Active Intake Widget */}
          {activeWidgetTab === "bodymap" && (
            <BodyMap
              onSelectSymptom={handleSymptomSelectFromMap}
              activeRegionId={initialRegion}
              lang={lang}
            />
          )}

          {activeWidgetTab === "vitals" && (
            <VitalsBar
              onVitalsChange={handleVitalsChange}
              hasHighRiskSymptom={triageState?.current_severity === "Severe"}
              lang={lang}
            />
          )}

          {activeWidgetTab === "fast" && (
            <FASTStrokeCard onTriggerStrokeEscalation={handleStrokeEscalation} lang={lang} />
          )}

          {activeWidgetTab === "map" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <DispatchMap patientCoords={coords} severity={triageState?.current_severity} autoAnimate={false} />
            </div>
          )}

          {activeWidgetTab === "meds" && (
            <MedicineScanner
              lang={lang}
              clinicalContext={{
                symptoms: messages.filter((m) => m.role === "user").map((m) => m.content).join(" ") || "Acute symptoms",
                selected_region: selectedBodyRegion,
                news2_score: currentScoring?.news?.score || 0,
                vitals: currentVitals,
              }}
              onAddMedication={(med) => {
                setScannedMedications((prev) => [...prev, med]);
                const alertMsg = med.is_contraindicated
                  ? `⚠️ [CONTRAINDICATION: ${med.brand_name} (${med.generic_name})]: ${med.clinical_alert_message}`
                  : `ℹ️ [MEDICATION LOGGED: ${med.brand_name} (${med.generic_name})]: Compatible with current triage state.`;
                setMessages((prev) => [...prev, { role: "assistant", content: alertMsg }]);
              }}
            />
          )}

          {/* Quick Demo Scenario Trigger */}
          {presetScenario && !triageState?.is_triage_complete && !loading && (() => {
            const stepIdx = Math.floor(messages.length / 2);
            const step = presetScenario.steps[stepIdx];
            if (!step) return null;
            return (
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex flex-col gap-1.5 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold">
                  {isBn ? `ডেমো দৃশ্যকল্প (ধাপ ${stepIdx + 1}/${presetScenario.steps.length}):` : `Quick Demo Simulation (Step ${stepIdx + 1} of ${presetScenario.steps.length}):`}
                </span>
                <button
                  onClick={() => handleSend(step.text)}
                  className="text-xs bg-white hover:bg-slate-100 text-teal-800 border border-teal-200 font-semibold px-3 py-2 rounded-lg transition text-left shadow-xs"
                >
                  👉 {isBn ? step.labelBn : step.labelEn}
                </button>
              </div>
            );
          })()}
        </div>

        {/* Right Column (5 cols): Triage Agent & Action Dispatch */}
        <div className="lg:col-span-5 space-y-4">
          {/* Clinical Safety Protocol Card (replaces raw Decision Flip Engine debugger) */}
          {triageState?.decision_flip_test && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs space-y-2 shadow-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>{isBn ? "ক্লিনিক্যাল সুরক্ষা প্রটোকল" : "Clinical Safety Protocol"}</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold ${
                    triageState.decision_flip_test.should_escalate
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  {triageState.decision_flip_test.should_escalate
                    ? (isBn ? "জরুরি সতর্কতা সক্রিয়" : "ESCALATE: SEVERE")
                    : (isBn ? "স্বাভাবিক পর্যবেক্ষণ" : "SAFE TO PROCEED")}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                <span className="text-slate-500 font-semibold">
                  {isBn ? "যাচাইকৃত জরুরি নির্দেশক:" : "Safety Parameter:"}
                </span>{" "}
                {triageState.decision_flip_test.missing_critical_info}
              </p>
              {triageState.clinical_rationale && (
                <p className="text-teal-800 text-[11px] bg-teal-50/80 p-2 rounded-lg border border-teal-200/80 leading-snug">
                  {triageState.clinical_rationale}
                </p>
              )}
            </div>
          )}

          {/* Chat Messages Section */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>{isBn ? "ট্রায়াজ কথোপকথন ও লক্ষণ পর্যালোচনা" : "Triage Dialogue & Clinical Q&A"}</span>
              </span>
              {messages.length > 0 && (
                <span className="text-xs text-slate-500 font-medium">{messages.length} messages</span>
              )}
            </div>

            <div className="min-h-[170px] max-h-[240px] overflow-y-auto space-y-2.5 pr-1">
              {messages.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-8 leading-relaxed">
                  {isBn ? (
                    <>
                      বাম পাশের <strong className="text-slate-700">শারীরিক ম্যাপ</strong> বা{" "}
                      <strong className="text-slate-700">ভাইটাল</strong> ব্যবহার করুন, অথবা নিচে কথা বলে / লিখে শুরু করুন।
                    </>
                  ) : (
                    <>
                      Select an anatomical zone on the <strong className="text-slate-700">Body Map</strong>, or speak/type below to begin intake.
                    </>
                  )}
                </div>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-teal-700 text-white ml-8 shadow-xs rounded-tr-xs"
                      : "bg-white text-slate-800 mr-8 border border-slate-200 shadow-xs rounded-tl-xs"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-xs text-xs text-teal-800 animate-pulse flex items-center gap-2 shadow-xs">
                  <Activity className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>{isBn ? "লক্ষণ ও নিরাপত্তা প্রটোকল মূল্যায়ন করা হচ্ছে..." : "Evaluating clinical markers & safety protocol..."}</span>
                </div>
              )}
            </div>
          </div>

          {/* Visual Injury & First-Aid Card */}
          {visualData && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2.5 shadow-xs">
              <div className="font-bold text-emerald-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? "আঘাত বিশ্লেষণ ও প্রাথমিক চিকিৎসা" : "Injury Analysis & First-Aid Guidance"}</span>
                </span>
                <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-emerald-800">
                  {isBn ? "নির্ভুলতা" : "Accuracy"}: {Math.round((visualData.sam_segmentation?.confidence || 0.94) * 100)}%
                </span>
              </div>

              {imagePreviewUrl && (
                <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                  <img src={imagePreviewUrl} alt="Uploaded symptom" className="max-h-full object-contain" />
                  <div className="absolute inset-4 border-2 border-dashed border-emerald-500 bg-emerald-500/10 rounded-lg flex flex-col items-center justify-center pointer-events-none">
                    <Crosshair className="w-4 h-4 text-emerald-700 animate-spin" />
                    <span className="text-[9px] font-bold bg-white/95 text-emerald-800 px-2 py-0.5 rounded shadow-xs mt-1">
                      {isBn ? "আঘাত চিহ্নিত • পরিষ্কার পানি দিয়ে ধুয়ে ফেলুন" : "ROI ISOLATED • COOL WITH WATER"}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-slate-700 font-medium">{visualData.sam_segmentation?.detected_region}</p>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-emerald-950 space-y-1 shadow-xs">
                <p className="font-bold text-xs">{visualData.first_aid_overlay?.instructions_bn}</p>
                <p className="text-slate-500 text-[11px]">{visualData.first_aid_overlay?.instructions_en}</p>
              </div>
            </div>
          )}

          {/* Emergency Intake Row (Voice, Photo, Rx, Text, Send) */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            {/* Wound Photo Upload */}
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-xs transition border border-slate-200 font-semibold shadow-xs">
              <Upload className="w-3.5 h-3.5 text-teal-600" />
              <span>{isBn ? "ক্ষতের ছবি" : "Photo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            {/* Medicine Scanner Open Button */}
            <button
              type="button"
              onClick={() => setActiveWidgetTab("meds")}
              className={`px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-xs transition font-semibold shadow-xs ${
                activeWidgetTab === "meds"
                  ? "bg-purple-700 text-white"
                  : "bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
              }`}
              title="Open Medicine Strip Scanner"
            >
              <Pill className="w-3.5 h-3.5 text-purple-600" />
              <span>{isBn ? "ওষুধ স্ক্যান" : "Scan Rx"}</span>
            </button>

            {/* Voice Language Toggle + Mic Button */}
            <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setVoiceLangOverride(voiceLang === "bn-BD" ? "en-US" : "bn-BD")}
                className="text-[11px] px-2 py-2 bg-slate-200/70 text-slate-800 font-bold border-r border-slate-300 hover:bg-slate-200 transition"
                title="Switch Voice Recognition Language"
              >
                {voiceLang === "bn-BD" ? "বাং" : "EN"}
              </button>
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`px-3 py-2 flex items-center gap-1 text-xs font-semibold transition ${
                  isListening
                    ? "bg-red-600 text-white animate-pulse"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
                title="Speak Symptoms"
              >
                <Mic className="w-4 h-4 text-teal-700" />
                <span>{isListening ? (isBn ? "শুনছি..." : "Listening...") : (isBn ? "বলুন" : "Voice")}</span>
              </button>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !triageState?.is_triage_complete && handleSend()}
              placeholder={
                triageState?.is_triage_complete
                  ? isBn
                    ? "ট্রায়াজ সম্পন্ন (পুনরায় শুরু করতে রিসেট চাপুন)"
                    : "Triage complete (Reset to start over)"
                  : isBn
                  ? "উপসর্গ বাংলায় বা ইংরেজিতে লিখুন..."
                  : "Describe symptoms in English or বাংলা..."
              }
              disabled={loading || triageState?.is_triage_complete}
              className="flex-1 min-w-[130px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || triageState?.is_triage_complete}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-xl flex items-center gap-1 text-xs font-bold transition shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Dispatch & Emergency Handoff HUD */}
          {dispatchData && (
            <div className="mt-2 space-y-3.5 border-t border-slate-200 pt-3">
              {/* Emergency Ambulance Voice Dispatch Alert */}
              {dispatchData.autonomous_ambulance_call && (
                <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 text-xs space-y-2 text-red-950 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs uppercase tracking-wide">
                      <PhoneCall className="w-4 h-4 animate-bounce text-red-600" />
                      <span>
                        {isBn ? "জরুরি অ্যাম্বুলেন্স ডিসপ্যাচ সক্রিয়" : "EMERGENCY AMBULANCE DISPATCHED"} (
                        {dispatchData.autonomous_ambulance_call.target_dispatcher})
                      </span>
                    </div>
                    <button
                      onClick={() => speakText(dispatchData.autonomous_ambulance_call.twiml_bengali_script, "bn-BD")}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isBn ? "কল শুনুন" : "Replay Call"}</span>
                    </button>
                  </div>
                  <p className="text-slate-900 font-semibold bg-white/90 p-2.5 rounded-xl border border-red-200 leading-relaxed">
                    "{dispatchData.autonomous_ambulance_call.twiml_bengali_script}"
                  </p>
                  <p className="text-slate-500 text-[11px] italic">
                    {dispatchData.autonomous_ambulance_call.english_transcript}
                  </p>
                </div>
              )}

              {/* Recommended Facilities & Scannable QR Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Facility Cards */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-xs space-y-2 shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isBn ? "নিকটস্থ চিকিৎসাকেন্দ্র" : "Nearby Facilities"}</span>
                    </span>
                    {coords && (
                      <span className="text-[10px] text-teal-700 font-mono">
                        GPS: {coords.lat.toFixed(2)}, {coords.lng.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {dispatchData.recommended_facilities?.map((f, i) => (
                    <div key={i} className="border-b border-slate-200 last:border-0 pb-2 pt-1">
                      <p className="font-bold text-slate-900">{f.name}</p>
                      <p className="text-slate-500 text-[11px]">
                        {f.type} • {f.distance} ({f.eta})
                      </p>
                      <p className="text-amber-700 font-medium text-[11px]">{isBn ? "ল্যান্ডমার্ক:" : "Landmark:"} {f.landmark}</p>
                    </div>
                  ))}
                </div>

                {/* Scannable ER SOAP Note QR Code */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-xs flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                    <QrCode className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isBn ? "হাসপাতাল ER হ্যান্ডঅফ QR" : "ER Handoff SOAP QR"}</span>
                  </div>
                  <img
                    src={dispatchData.er_handoff_packet?.qr_code_data_url}
                    alt="ER Soap Note QR"
                    className="w-24 h-24 rounded-xl border border-slate-300 bg-white p-1 shadow-xs"
                  />
                  <p className="text-xs text-teal-800 font-mono font-bold mt-2">
                    {dispatchData.er_handoff_packet?.soap_note?.esi_level || `ESI Level ${currentEsi}`}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate">
                    {dispatchData.er_handoff_packet?.soap_note?.plan}
                  </p>
                </div>
              </div>

              {/* Embedded Live Route Map */}
              <div className="pt-1">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                  <DispatchMap
                    patientCoords={coords}
                    severity={triageState?.current_severity}
                    autoAnimate={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

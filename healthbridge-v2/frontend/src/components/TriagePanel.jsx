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
  ChevronRight,
  StopCircle,
  Zap,
  Cpu,
} from "lucide-react";

const CHIEF_COMPLAINTS = [
  {
    icon: "🫀",
    titleBn: "বুকে প্রচণ্ড চাপ বা ব্যথা",
    titleEn: "Crushing Chest Pain / Pressure",
    subtitleBn: "বাম হাত, চোয়াল বা পিঠে ছড়ানো ব্যথা",
    subtitleEn: "Radiating to left arm, neck, or jaw",
    textBn: "আমার হঠাৎ খুব মাথা ঘুরছে এবং বুকে প্রচণ্ড চাপ লাগছে",
    textEn: "I suddenly feel very dizzy with severe chest pressure",
  },
  {
    icon: "🧠",
    titleBn: "মাথা ঘোরা ও কথা জড়িয়ে যাওয়া",
    titleEn: "Dizziness & Slurred Speech",
    subtitleBn: "মুখ বা হাতের এক পাশ অবশ লাগা (স্ট্রোক লক্ষণ)",
    subtitleEn: "Unilateral weakness or numbness (FAST)",
    textBn: "আমার মাথা খুব ঘুরছে এবং কথা জড়িয়ে যাচ্ছে, এক হাত দুর্বল লাগছে",
    textEn: "Sudden severe dizziness, slurred speech, and arm weakness",
  },
  {
    icon: "🫁",
    titleBn: "তীব্র শ্বাসকষ্ট ও বুক ধড়ফড়",
    titleEn: "Severe Breathlessness & Gasping",
    subtitleBn: "শ্বাস নিতে কষ্ট ও প্রচণ্ড অস্বস্তি",
    subtitleEn: "Difficulty breathing, tachycardia, hypoxia",
    textBn: "আমার প্রচণ্ড শ্বাসকষ্ট হচ্ছে এবং বুকে চাপ অনুভূত হচ্ছে",
    textEn: "Severe shortness of breath with chest tightness",
  },
  {
    icon: "🩸",
    titleBn: "রক্তপাত, গভীর ক্ষত বা পোড়া",
    titleEn: "Bleeding Wound, Burn, or Trauma",
    subtitleBn: "অবিরাম রক্তপাত বা শরীরের আঘাত",
    subtitleEn: "Active bleeding, burns, or laceration",
    textBn: "আমার শরীরে গভীর ক্ষত হয়ে অবিরাম রক্তক্ষরণ হচ্ছে",
    textEn: "Deep open injury with continuous active bleeding",
  },
];

function getGuidedOptions(lastAssistantMsg, isBn) {
  if (!lastAssistantMsg) return [];
  const text = lastAssistantMsg.toLowerCase();

  // Cardiac / Chest / Radiation
  if (
    text.includes("বুক") ||
    text.includes("chest") ||
    text.includes("হার্ট") ||
    text.includes("হাত") ||
    text.includes("arm") ||
    text.includes("pressure")
  ) {
    return [
      {
        text: isBn
          ? "হ্যাঁ, বাম হাত ও চোয়ালে ছড়াচ্ছে এবং ঠান্ডা ঘাম হচ্ছে"
          : "Yes, radiating to left arm/jaw with cold sweat",
        label: isBn ? "হ্যাঁ, বাম হাত/চোয়ালে ছড়াচ্ছে" : "Yes, radiating to arm/jaw",
        badge: isBn ? "উচ্চ ঝুঁকি" : "High Risk",
        badgeColor: "bg-red-100 text-red-800 border-red-200",
      },
      {
        text: isBn
          ? "না, কেবল বুকেই সীমাবদ্ধ, কোথাও ছড়াচ্ছে না"
          : "No, localized to chest only, not radiating",
        label: isBn ? "না, কেবল বুকেই সীমাবদ্ধ" : "No, chest only",
        badge: isBn ? "সীমিত" : "Localized",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        text: isBn
          ? "হাঁটাহাঁটি বা পরিশ্রম করলে বাড়ে, বিশ্রাম নিলে একটু কমে"
          : "Worse upon exertion, improves slightly at rest",
        label: isBn ? "পরিশ্রমে বাড়ে, বিশ্রামে কমে" : "Worse on exertion",
        badge: isBn ? "অ্যাঞ্জাইনা লক্ষণ" : "Exertional",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        text: isBn
          ? "না, এমন কোনো অতিরিক্ত লক্ষণ বা ছড়ানো নেই"
          : "No other red flags or radiating pain",
        label: isBn ? "না, অন্য কোনো সমস্যা নেই" : "No other red flags",
        badge: isBn ? "স্বাভাবিক" : "Negative",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
    ];
  }

  // Bleeding / Wound / Trauma
  if (
    text.includes("রক্ত") ||
    text.includes("ক্ষত") ||
    text.includes("bleed") ||
    text.includes("wound") ||
    text.includes("কাটা") ||
    text.includes("পোড়া")
  ) {
    return [
      {
        text: isBn
          ? "হ্যাঁ, ক্ষত থেকে অবিরাম তীব্র রক্তপাত হচ্ছে"
          : "Yes, active and continuous heavy bleeding",
        label: isBn ? "হ্যাঁ, অবিরাম রক্ত পড়ছে" : "Yes, continuous bleeding",
        badge: isBn ? "জরুরি" : "Urgent",
        badgeColor: "bg-red-100 text-red-800 border-red-200",
      },
      {
        text: isBn
          ? "কাপড় দিয়ে চাপ দিয়ে ধরে রাখলে রক্ত কিছুটা নিয়ন্ত্রণে আসে"
          : "Bleeding slows when pressure is applied with cloth",
        label: isBn ? "চাপে রক্তপাত কমে" : "Slows with pressure",
        badge: isBn ? "নিয়ন্ত্রিত" : "Controlled",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        text: isBn
          ? "চামড়ার নিচে গভীর স্তর বা মাংস দেখা যাচ্ছে"
          : "Deep tissue or underlying structure visible",
        label: isBn ? "গভীর উন্মুক্ত ক্ষত" : "Deep open wound",
        badge: isBn ? "সিভিয়ার" : "Severe",
        badgeColor: "bg-red-100 text-red-800 border-red-200",
      },
      {
        text: isBn
          ? "না, কেবল ওপরের চামড়া সামান্য ছড়ে গেছে"
          : "Minor superficial scratch / minimal scrape",
        label: isBn ? "সামান্য ছড়ে যাওয়া" : "Minor scrape only",
        badge: isBn ? "মৃদু" : "Mild",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
    ];
  }

  // Neuro / Dizziness / Speech / FAST
  if (
    text.includes("মাথা") ||
    text.includes("dizz") ||
    text.includes("কথা") ||
    text.includes("speech") ||
    text.includes("অবশ") ||
    text.includes("stroke")
  ) {
    return [
      {
        text: isBn
          ? "হ্যাঁ, কথা জড়িয়ে যাচ্ছে এবং হাত বা মুখের এক পাশ অবশ লাগছে"
          : "Yes, slurred speech and numbness in one side",
        label: isBn ? "কথা জড়িয়ে যাওয়া ও অবশ লাগা" : "Slurred speech & numbness",
        badge: isBn ? "স্ট্রোক সতর্কবার্তা" : "Stroke Alert",
        badgeColor: "bg-red-100 text-red-800 border-red-200",
      },
      {
        text: isBn
          ? "না, কথা স্পষ্ট আছে, কেবল হঠাৎ মাথা ঘুরছে"
          : "Speech is normal, just feeling acutely dizzy",
        label: isBn ? "কথা স্বাভাবিক, শুধু মাথা ঘুরছে" : "Speech normal, dizzy only",
        badge: isBn ? "পর্যবেক্ষণ" : "Moderate",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        text: isBn
          ? "দাঁড়াতে গেলে চোখে অন্ধকার লাগে ও ভারসাম্য রাখা যায় না"
          : "Postural dizziness, feeling faint when standing",
        label: isBn ? "দাঁড়ালে চোখে অন্ধকার লাগা" : "Faint when standing",
        badge: isBn ? "হাইপোটেনশন" : "Postural",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      },
      {
        text: isBn
          ? "না, কথা বলা বা চলাফেরায় কোনো সমস্যা নেই"
          : "No difficulty with speech or movement",
        label: isBn ? "না, চলাফেরা ও কথা স্বাভাবিক" : "Normal movement & speech",
        badge: isBn ? "নিরাপদ" : "Clear",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
    ];
  }

  // Generic clinical questions
  return [
    {
      text: isBn
        ? "হ্যাঁ, উপসর্গটি তীব্র ও ক্রমেই বাড়ছে"
        : "Yes, symptom is severe and worsening",
      label: isBn ? "হ্যাঁ, উপসর্গটি তীব্র" : "Yes, symptom is severe",
      badge: isBn ? "পজিটিভ" : "Yes",
      badgeColor: "bg-red-100 text-red-800 border-red-200",
    },
    {
      text: isBn
        ? "না, এমন কোনো উপসর্গ বা সমস্যা নেই"
        : "No, denies having this symptom",
      label: isBn ? "না, এমন কোনো সমস্যা নেই" : "No, symptom absent",
      badge: isBn ? "নেগেটিভ" : "No",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    {
      text: isBn
        ? "মাঝে মাঝে হালকাভাবে হয়, তীব্র নয়"
        : "Occurs intermittently, mild in intensity",
      label: isBn ? "মাঝে মাঝে হালকা অনুভূত হয়" : "Mild / intermittent",
      badge: isBn ? "মৃদু" : "Mild",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
    {
      text: isBn
        ? "সঠিকভাবে নিশ্চিত নই বা বলতে পারছি না"
        : "Unsure or cannot reliably verify",
      label: isBn ? "নিশ্চিত নই / বলতে পারছি না" : "Unsure / Cannot tell",
      badge: isBn ? "অনিশ্চিত" : "Unclear",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];
}

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
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  // Active intake widget tab: 'bodymap' | 'vitals' | 'fast' | 'map' | 'meds'
  const [activeWidgetTab, setActiveWidgetTab] = useState("bodymap");
  const [currentVitals, setCurrentVitals] = useState(null);
  const [currentScoring, setCurrentScoring] = useState(null);
  const [selectedBodyRegion, setSelectedBodyRegion] = useState(initialRegion);
  const [scannedMedications, setScannedMedications] = useState([]);
  const [activeProvider, setActiveProvider] = useState("gemini"); // 'gemini' | 'meta' | 'protocol'

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
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch {
        // ignore
      }
    }
    setMessages([]);
    setInput("");
    setLoading(false);
    setTriageState(null);
    setVisualData(null);
    setImagePreviewUrl(null);
    setDispatchData(null);
    setScannedMedications([]);
    setActiveWidgetTab("bodymap");
    setIsListening(false);
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
        selectedBodyRegion,
        activeProvider
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
      } else {
        const defaultPrompt = isBn
          ? "হ্যালো! আপনার শারীরিক সমস্যা বা লক্ষণগুলো অনুগ্রহ করে বলুন, আমি মূল্যায়ন করছি।"
          : "Hello! Please describe what symptoms or discomfort you are experiencing.";
        setMessages([...updatedMessages, { role: "assistant", content: defaultPrompt }]);
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
    if (isListening) {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const rec = startVoiceRecognition(
      voiceLang,
      (transcript) => {
        setIsListening(false);
        setInput(transcript);
        handleSend(transcript);
      },
      () => setIsListening(false)
    );
    setRecognitionInstance(rec);
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

  // Determine current step in clinical progression
  const currentStep = triageState?.is_triage_complete ? 3 : messages.length > 0 ? 2 : 1;

  // Find last assistant question for Ada-style guided quick options
  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((m) => m.role === "assistant");
  const guidedOptions =
    !triageState?.is_triage_complete && lastAssistantMessage
      ? getGuidedOptions(lastAssistantMessage.content, isBn)
      : [];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 flex flex-col gap-5 shadow-xs">
      {/* 3-Step Clinical Progression Stepper */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 px-4 text-xs font-semibold">
        <div className={`flex items-center gap-2 ${currentStep >= 1 ? "text-teal-800 font-bold" : "text-slate-400"}`}>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep >= 1 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            1
          </span>
          <span>{isBn ? "লক্ষণ ইনটেক" : "Symptom Intake"}</span>
        </div>
        <div className={`hidden sm:block flex-1 mx-3 h-0.5 ${currentStep >= 2 ? "bg-teal-500" : "bg-slate-200"}`}></div>
        <div className={`flex items-center gap-2 ${currentStep >= 2 ? "text-teal-800 font-bold" : "text-slate-400"}`}>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep >= 2 ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            2
          </span>
          <span>{isBn ? "ক্লিনিক্যাল ড্রিল-ডাউন" : "Clinical Questions"}</span>
        </div>
        <div className={`hidden sm:block flex-1 mx-3 h-0.5 ${currentStep >= 3 ? "bg-red-500" : "bg-slate-200"}`}></div>
        <div className={`flex items-center gap-2 ${currentStep >= 3 ? "text-red-700 font-bold" : "text-slate-400"}`}>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              currentStep >= 3 ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            3
          </span>
          <span>{isBn ? "জরুরি প্রস্তুতি ও ডিসপ্যাচ" : "Dispatch & Action"}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
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
              <DispatchMap
                patientCoords={coords}
                severity={triageState?.current_severity}
                targetHospital={dispatchData?.recommended_facilities?.[0]}
                autoAnimate={false}
                lang={lang}
              />
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
          {/* Clinical Safety Protocol Card */}
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

          {/* Active Voice Waveform Orb (when recording) */}
          {isListening && (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 text-center shadow-xs">
              <div className="flex items-center gap-1.5 h-8">
                <span className="w-1.5 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1.5 h-7 bg-red-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1.5 h-8 bg-red-600 rounded-full animate-bounce [animation-delay:300ms]"></span>
                <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:450ms]"></span>
                <span className="w-1.5 h-6 bg-red-600 rounded-full animate-bounce [animation-delay:600ms]"></span>
              </div>
              <div>
                <p className="font-extrabold text-xs text-red-950">
                  {isBn ? "আপনার কণ্ঠ শোনা হচ্ছে... কথা বলুন" : "Listening to your voice... Speak now"}
                </p>
                <p className="text-[11px] text-red-700/80 mt-0.5">
                  {isBn
                    ? `ভাষা: বাংলা (${voiceLang}) • যেমন: 'আমার বুকে খুব চাপ লাগছে'`
                    : `Language: English (${voiceLang}) • e.g. 'Severe chest pain'`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleVoiceInput}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <StopCircle className="w-4 h-4" />
                <span>{isBn ? "বলা শেষ হলে এখানে চাপুন (Stop)" : "Done Speaking (Stop)"}</span>
              </button>
            </div>
          )}

          {/* AI Model Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-bold text-[11px]">
                {isBn ? "লাইভ এআই ইঞ্জিন:" : "Live AI Engine:"}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveProvider("gemini")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                  activeProvider === "gemini"
                    ? "bg-teal-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Google Gemini 3.1 Flash Lite (<1s sub-second latency)"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Gemini Flash</span>
                <span className={`text-[9px] px-1 rounded font-mono ${activeProvider === "gemini" ? "bg-teal-800 text-teal-200" : "bg-slate-300 text-slate-700"}`}>
                  &lt;1s
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProvider("meta")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition ${
                  activeProvider === "meta"
                    ? "bg-indigo-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Meta Muse Spark 1.3 (Deep Clinical Reasoning ~15s)"
              >
                <Brain className="w-3 h-3 text-indigo-300" />
                <span>Meta Muse</span>
                <span className={`text-[9px] px-1 rounded font-mono ${activeProvider === "meta" ? "bg-indigo-800 text-indigo-200" : "bg-slate-300 text-slate-700"}`}>
                  Deep
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveProvider("protocol")}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition ${
                  activeProvider === "protocol"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Deterministic WHO Emergency Triage Protocol (Offline)"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>WHO Protocol</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Section */}
          <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2.5 mb-3 gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>{isBn ? "ট্রায়াজ কথোপকথন ও লক্ষণ পর্যালোচনা" : "Triage Dialogue & Clinical Q&A"}</span>
              </span>
              <div className="flex items-center gap-2">
                {triageState?.provider_used && (
                  <span className="text-[10px] bg-teal-100/90 text-teal-900 border border-teal-200 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-teal-700" />
                    <span>{triageState.provider_used}</span>
                    {triageState.latency_seconds ? (
                      <span className="font-bold text-teal-950">• {triageState.latency_seconds}s</span>
                    ) : null}
                  </span>
                )}
                {messages.length > 0 && (
                  <span className="text-xs text-slate-500 font-medium">{messages.length} messages</span>
                )}
              </div>
            </div>

            <div className="min-h-[170px] max-h-[260px] overflow-y-auto space-y-2.5 pr-1">
              {/* If no messages yet, show Chief Complaint Quick Starter cards */}
              {messages.length === 0 && (
                <div className="space-y-2.5 py-1">
                  <p className="text-xs font-semibold text-slate-600">
                    {isBn ? "প্রধান জরুরি উপসর্গ বেছে নিয়ে তাৎক্ষণিক শুরু করুন:" : "Quick Start — Select your chief complaint:"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CHIEF_COMPLAINTS.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(isBn ? c.textBn : c.textEn)}
                        className="text-left p-2.5 rounded-xl bg-white hover:bg-teal-50/70 border border-slate-200/90 hover:border-teal-300 transition shadow-xs flex items-start gap-2.5 group"
                      >
                        <span className="text-lg shrink-0">{c.icon}</span>
                        <div>
                          <span className="font-bold text-xs text-slate-800 group-hover:text-teal-900 block leading-tight">
                            {isBn ? c.titleBn : c.titleEn}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block leading-tight">
                            {isBn ? c.subtitleBn : c.subtitleEn}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-slate-400 text-center pt-2">
                    {isBn
                      ? "অথবা বামের শারীরিক ম্যাপ স্পর্শ করুন / নিচে লিখুন বা বলুন"
                      : "Or tap the body map on the left / speak or type below"}
                  </div>
                </div>
              )}

              {/* Message Feed */}
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

          {/* Ada Health-Style Guided Quick-Tap Chips */}
          {guidedOptions.length > 0 && !loading && (
            <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-3.5 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{isBn ? "দ্রুত উত্তর দিতে চাপুন (Quick Responses):" : "Suggested Clinical Responses:"}</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {guidedOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(opt.text)}
                    className="p-2.5 rounded-xl bg-white hover:bg-teal-100/70 border border-teal-200 text-left transition flex items-center justify-between gap-2 shadow-xs group"
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900 block leading-tight">
                        {opt.label}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium mt-1 inline-block ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-teal-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

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
                      {isBn
                        ? (visualData.sam_segmentation?.overlay_badge_bn || "আঘাত চিহ্নিত • ক্ষত পর্যবেক্ষণ")
                        : (visualData.sam_segmentation?.overlay_badge_en || "ROI IDENTIFIED • CLINICAL EVALUATION")}
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
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                triageState?.is_triage_complete
                  ? isBn
                    ? "আরও কিছু জানতে চান বা নতুন লক্ষণ যোগ করতে চান? লিখুন..."
                    : "Ask a follow-up or update symptoms..."
                  : isBn
                  ? "উপসর্গ বাংলায় বা ইংরেজিতে লিখুন..."
                  : "Describe symptoms in English or বাংলা..."
              }
              disabled={loading}
              className="flex-1 min-w-[130px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2 rounded-xl flex items-center gap-1 text-xs font-bold transition shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Dispatch & Emergency Handoff HUD */}
          {dispatchData && (
            <div className="mt-2 space-y-4 border-t border-slate-200 pt-4">
              {/* Emergency Ambulance Voice Dispatch Alert */}
              {dispatchData.autonomous_ambulance_call && (
                <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 sm:p-5 text-xs space-y-3 text-red-950 shadow-sm">
                  {/* Top Header & 999 Direct Call Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 text-red-700 font-extrabold text-xs uppercase tracking-wide">
                      <div className="p-1.5 bg-red-600 text-white rounded-lg animate-bounce">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <span>{isBn ? "জরুরি অ্যাম্বুলেন্স ডিসপ্যাচ সক্রিয়" : "EMERGENCY AMBULANCE DISPATCHED"}</span>
                        <span className="block text-[10px] text-red-600/90 font-mono font-normal">
                          {dispatchData.autonomous_ambulance_call.target_dispatcher}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="tel:999"
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{isBn ? "৯৯৯ কল করুন" : "Call 999 Now"}</span>
                      </a>
                      <button
                        onClick={() => speakText(dispatchData.autonomous_ambulance_call.twiml_bengali_script, "bn-BD")}
                        className="bg-white hover:bg-red-50 text-red-700 border border-red-300 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isBn ? "ভয়েস শুনুন" : "Hear Voice Call"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Audio Dispatch Waveform & Script Strip */}
                  <div className="bg-white/90 p-3.5 rounded-xl border border-red-200 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-red-700 font-bold">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                      <span>{isBn ? "অ্যাম্বুলেন্স কন্ট্রোল রুমে প্রেরিত সরাসরি বার্তা:" : "Automated Bengali Radio Voice Message:"}</span>
                    </div>
                    <p className="text-slate-900 font-semibold text-xs leading-relaxed">
                      "{dispatchData.autonomous_ambulance_call.twiml_bengali_script}"
                    </p>
                    <p className="text-slate-500 text-[11px] italic border-t border-slate-100 pt-1.5">
                      {dispatchData.autonomous_ambulance_call.english_transcript}
                    </p>
                  </div>
                </div>
              )}

              {/* Recommended Facilities & Scannable QR Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Facility Cards */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs space-y-2.5 shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isBn ? "প্রস্তাবিত জরুরি চিকিৎসাকেন্দ্র" : "Recommended Facilities"}</span>
                    </span>
                    {coords && (
                      <span className="text-[10px] text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        GPS: {coords.lat.toFixed(2)}, {coords.lng.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dispatchData.recommended_facilities?.map((f, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 text-xs">{f.name}</p>
                          <span className="text-[10px] font-bold text-teal-700 font-mono bg-teal-50 px-1.5 py-0.2 rounded">
                            {f.eta}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          {f.type} • {f.distance}
                        </p>
                        <p className="text-amber-700 font-medium text-[11px]">
                          {isBn ? "নিকটবর্তী ল্যান্ডমার্ক:" : "Landmark:"} {f.landmark}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scannable ER SOAP Note QR Code Pass */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-xs flex flex-col items-center justify-center text-center shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                    <QrCode className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isBn ? "হাসপাতাল ER হ্যান্ডঅফ ভাউচার" : "ER Clinical Intake Pass"}</span>
                  </div>
                  <div className="bg-white p-2 rounded-2xl border border-slate-300 shadow-xs">
                    <img
                      src={dispatchData.er_handoff_packet?.qr_code_data_url}
                      alt="ER Soap Note QR"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <p className="text-xs text-teal-800 font-mono font-extrabold mt-2">
                    {dispatchData.er_handoff_packet?.soap_note?.esi_level || `ESI Level ${currentEsi}`}
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5 max-w-[220px]">
                    {isBn
                      ? "হাসপাতালে পৌঁছানোর সাথে সাথে ট্রমা ডেস্কে এই কিউআর স্ক্যান করুন"
                      : "Scan directly at ER trauma intake desk to bypass waiting line"}
                  </p>
                </div>
              </div>

              {/* Embedded Live Route Map */}
              <div className="pt-1">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                  <DispatchMap
                    patientCoords={coords}
                    severity={triageState?.current_severity}
                    targetHospital={dispatchData?.recommended_facilities?.[0]}
                    autoAnimate={true}
                    lang={lang}
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

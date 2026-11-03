import React, { useState } from "react";
import TriagePanel from "./components/TriagePanel";
import HospitalERDashboard from "./components/HospitalERDashboard";
import { Activity, Stethoscope, User, Bell, ShieldCheck } from "lucide-react";

const DEMO_PRESET = {
  steps: [
    {
      labelEn: "1. Chest pressure & dizziness",
      labelBn: "১. বুকে প্রচণ্ড চাপ ও মাথা ঘোরা",
      text: "আমার হঠাৎ খুব মাথা ঘুরছে এবং বুকে প্রচণ্ড চাপ লাগছে (I suddenly feel very dizzy with severe chest pressure)",
    },
    {
      labelEn: "2. Left arm numbness & cold sweat",
      labelBn: "২. বাম হাত অবশ ও ঠান্ডা ঘাম",
      text: "হ্যাঁ, আমার বাম হাত অবশ লাগছে এবং ঠান্ডা ঘাম বের হচ্ছে (Left arm is numb and sweating heavily)",
    },
  ],
};

export default function App() {
  // 'patient' (Clean Clinical Triage) | 'hospital' (ER Telemetry Console)
  const [persona, setPersona] = useState("patient");
  const [lang, setLang] = useState("bn"); // 'bn' | 'en'

  const [activeCase, setActiveCase] = useState({
    patientId: "HB-8092",
    etaMinutes: 7,
    chiefComplaint: "Acute retrosternal crushing chest pressure radiating to left arm",
    chiefComplaintBn: "বুকে প্রচণ্ড চাপ, যা বাম হাত ও চোয়ালে ছড়াচ্ছে",
    severity: "Severe",
    esiLevel: 2,
    news2Score: 7,
    vitals: {
      heartRate: 118,
      systolicBp: 165,
      diastolicBp: 98,
      spo2: 94,
      respiratoryRate: 24,
      tempCelsius: 37.2,
      avpu: "Alert",
      painLevel: 9,
    },
    decisionFlipTrigger: "Critical cardiac red flags confirmed; no symptom relief at rest",
    assignedBay: "Resuscitation Bay 2",
    dispatcher: "Dhaka Medical College Emergency Dispatch",
    ambulanceId: "AMB-DH-304",
    landmark: "Near Shaheed Minar / Bakshibazar Gate",
    timeReported: "2 mins ago",
  });

  const handleTriageCompleted = (newCase) => {
    setActiveCase(newCase);
  };

  const isPatientMode = persona === "patient";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isPatientMode
          ? "bg-slate-100/80 text-slate-800 selection:bg-teal-600 selection:text-white"
          : "bg-[#090b10] text-slate-100 selection:bg-red-600 selection:text-white"
      }`}
    >
      {/* Top Clinical Navigation Bar */}
      <header
        className={`border-b sticky top-0 z-30 px-4 sm:px-8 py-3 transition-colors ${
          isPatientMode
            ? "bg-white/95 border-slate-200/90 backdrop-blur shadow-xs"
            : "bg-[#0f131c]/95 border-slate-800/90 backdrop-blur shadow-md"
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shadow-xs flex items-center justify-center font-bold text-white transition-colors ${
                isPatientMode ? "bg-teal-600" : "bg-red-600"
              }`}
            >
              <Activity className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`font-extrabold text-lg tracking-tight ${
                    isPatientMode ? "text-slate-900" : "text-white"
                  }`}
                >
                  HealthBridge
                </h1>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    isPatientMode
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-red-950/60 text-red-300 border-red-700/60"
                  }`}
                >
                  {lang === "bn" ? "জরুরি স্বাস্থ্য সেবা" : "Emergency Care"}
                </span>
              </div>
              <p
                className={`text-xs ${
                  isPatientMode ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {lang === "bn"
                  ? "স্বায়ত্বশাসিত দ্বিভাষিক প্রিহসপিটাল ট্রায়াজ ও ইমার্জেন্সি ডিসপ্যাচ"
                  : "Clinical Prehospital Triage ⟷ Hospital ER Telemetry"}
              </p>
            </div>
          </div>

          {/* Persona Switcher & Language Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Pill */}
            <div
              className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
                isPatientMode
                  ? "bg-slate-100 border-slate-200 text-slate-600"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setLang("bn")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === "bn"
                    ? isPatientMode
                      ? "bg-white text-teal-700 font-bold shadow-xs"
                      : "bg-slate-800 text-white font-bold"
                    : "hover:text-slate-900 opacity-70"
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === "en"
                    ? isPatientMode
                      ? "bg-white text-teal-700 font-bold shadow-xs"
                      : "bg-slate-800 text-white font-bold"
                    : "hover:text-slate-900 opacity-70"
                }`}
              >
                English
              </button>
            </div>

            {/* Persona Switcher */}
            <div
              className={`flex items-center p-1 rounded-xl border ${
                isPatientMode
                  ? "bg-slate-100 border-slate-200"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <button
                onClick={() => setPersona("patient")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  persona === "patient"
                    ? "bg-teal-600 text-white shadow-xs"
                    : isPatientMode
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{lang === "bn" ? "রোগীর ট্রায়াজ" : "Patient Triage"}</span>
              </button>

              <button
                onClick={() => setPersona("hospital")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
                  persona === "hospital"
                    ? "bg-red-600 text-white shadow-xs"
                    : isPatientMode
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{lang === "bn" ? "হাসপাতাল ER কনসোল" : "Hospital ER Console"}</span>
                {activeCase?.severity === "Severe" && (
                  <span className="flex items-center gap-1 text-[9px] bg-red-950 text-red-200 border border-red-400/60 px-1.5 py-0.2 rounded-full font-mono animate-pulse">
                    <Bell className="w-2.5 h-2.5 text-red-400" />
                    <span>Inbound</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {persona === "patient" ? (
          <div className="space-y-4">
            {/* Quick Context Guidance Banner */}
            <div className="bg-teal-50/90 border border-teal-200/90 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-teal-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="bg-teal-600 text-white p-1 rounded-full shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>
                  <strong>{lang === "bn" ? "জরুরি ট্রায়াজ নির্দেশিকা:" : "Emergency Triage Guidance:"}</strong>{" "}
                  {lang === "bn"
                    ? "শারীরিক লক্ষণ নির্দেশক বা কথা বলে আপনার উপসর্গ জানান। জরুরি ক্ষেত্রে সরাসরি অ্যাম্বুলেন্স কল ও হাসপাতাল প্রস্তুতি সম্পন্ন হবে।"
                    : "Tap the body map, speak in Bengali/English, or upload an injury photo to determine care urgency and initiate emergency dispatch."}
                </span>
              </div>
              <button
                onClick={() => setPersona("hospital")}
                className="text-xs bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs"
              >
                <span>{lang === "bn" ? "হাসপাতাল ER ড্যাশবোর্ড দেখুন" : "View Hospital ER Console"}</span>
                <span>&rarr;</span>
              </button>
            </div>

            {/* Patient Triage Cockpit (Passes lang) */}
            <TriagePanel
              lang={lang}
              presetScenario={DEMO_PRESET}
              initialRegion="chest"
              onTriageComplete={handleTriageCompleted}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hospital ER Guidance Banner */}
            <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-red-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="bg-red-600 text-white p-1 rounded-full shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span>
                  <strong>{lang === "bn" ? "হাসপাতাল ট্রমা টিম কন্ট্রোল:" : "Hospital Trauma Control:"}</strong>{" "}
                  {lang === "bn"
                    ? "মাঠপর্যায়ের অ্যাম্বুলেন্স থেকে আগত রোগীর ভাইটাল, এসবিএআর ক্লিনিক্যাল নোট ও ওষুধের কন্ট্রা-ইন্ডিকেশন পর্যবেক্ষণ করুন।"
                    : "Live pre-arrival telemetry from field ambulances. Review clinical SBAR, assign trauma resuscitation bays, and export FHIR records."}
                </span>
              </div>
              <button
                onClick={() => setPersona("patient")}
                className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-semibold transition"
              >
                &larr; {lang === "bn" ? "রোগীর ট্রায়াজে ফিরুন" : "Return to Patient Intake"}
              </button>
            </div>

            {/* Hospital ER Trauma & Receiving Console */}
            <HospitalERDashboard activeCase={activeCase} lang={lang} />
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState } from "react";
import DispatchMap from "./DispatchMap";
import {
  Activity,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Bed,
  Stethoscope,
  Copy,
  Check,
  Bell,
  Navigation,
  Pill,
  ShieldAlert,
} from "lucide-react";

export default function HospitalERDashboard({ activeCase = null, onSelectCase, lang = "bn" }) {
  const isBn = lang === "bn";
  const [selectedCaseId, setSelectedCaseId] = useState("HB-8092");
  const [isAccepted, setIsAccepted] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);
  const [activeTab, setActiveTab] = useState("dossier"); // 'dossier' | 'map'
  const [checklist, setChecklist] = useState({
    ecg: true,
    oxygen: true,
    ivAccess: true,
    cardiacStat: false,
    traumaBay: true,
  });

  const toggleCheck = (item) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const liveCase = activeCase || {
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
    timeReported: "3 mins ago",
    medications: activeCase?.medications || [
      {
        brand_name: "Ecosprin 75",
        generic_name: "Aspirin (Acetylsalicylic Acid)",
        strength: "75 mg",
        drug_class: "NSAID / Antiplatelet",
        manufacturer: "Square Pharmaceuticals Ltd.",
        is_contraindicated: true,
        contraindication_severity: "CRITICAL",
        clinical_alert_message:
          "CRITICAL DANGER: Pre-hospital ingestion of Aspirin. Risk of internal hemorrhage & irreversible platelet inhibition.",
        bengali_patient_instruction: "রোগী হাসপাতালে পৌঁছানোর আগে অ্যাসপিরিন খাওয়া বন্ধ রাখা হয়েছে।",
        safe_alternative: "Paracetamol 500mg IV on arrival.",
        er_prearrival_action: "Stat CBC, Platelet count, PT/INR blood draw ready on arrival.",
      },
    ],
  };

  const queue = [
    liveCase,
    {
      patientId: "HB-8091",
      etaMinutes: 18,
      chiefComplaint: "Right ankle compound fracture with controlled venous bleeding",
      chiefComplaintBn: "ডান পায়ের গোড়ালিতে ফ্র্যাকচার ও রক্তপাত",
      severity: "Moderate",
      esiLevel: 3,
      news2Score: 2,
      vitals: {
        heartRate: 88,
        systolicBp: 130,
        diastolicBp: 82,
        spo2: 98,
        respiratoryRate: 18,
        tempCelsius: 36.8,
        avpu: "Alert",
        painLevel: 6,
      },
      decisionFlipTrigger: "Active bleeding controlled; vascular distal pulse palpable",
      assignedBay: "Acute Bay 4",
      dispatcher: "Praava Emergency Link",
      ambulanceId: "AMB-DH-112",
      landmark: "Mohakhali Flyover, South End",
      timeReported: "11 mins ago",
    },
  ];

  const currentCase = queue.find((c) => c.patientId === selectedCaseId) || queue[0];

  const fhirPayload = {
    resourceType: "Encounter",
    id: currentCase.patientId,
    status: isAccepted ? "in-progress" : "planned",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "EMER",
      display: "Emergency Pre-Arrival Intake",
    },
    priority: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
          code: currentCase.esiLevel <= 2 ? "CR" : "EL",
          display: `ESI Level ${currentCase.esiLevel} (Emergency Severity Index)`,
        },
      ],
    },
    subject: {
      display: "HealthBridge Tele-Triage Inbound Patient",
    },
    reasonCode: [
      {
        text: currentCase.chiefComplaint,
      },
    ],
    hospitalization: {
      preAdmissionIdentifier: {
        value: currentCase.ambulanceId,
      },
      destination: {
        display: `Dhaka Medical College Hospital - ${currentCase.assignedBay}`,
      },
    },
    clinicalAssessment: {
      news2Score: currentCase.news2Score,
      decisionFlipGuardrail: currentCase.decisionFlipTrigger,
      vitals: currentCase.vitals,
      scannedMedications: (currentCase.medications || []).map((m) => ({
        brand: m.brand_name,
        generic: m.generic_name,
        strength: m.strength,
        contraindicated: m.is_contraindicated,
        alert: m.clinical_alert_message,
      })),
    },
  };

  const handleCopyFhir = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirPayload, null, 2));
    setCopiedFhir(true);
    setTimeout(() => setCopiedFhir(false), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Hospital ER Status Strip */}
      <div className="bg-[#0f1420] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="bg-red-600/20 border border-red-500/40 p-3 rounded-xl text-red-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-extrabold text-white tracking-tight">
                {isBn
                  ? "ঢাকা মেডিকেল কলেজ হাসপাতাল — ইমার্জেন্সি ও ট্রমা সেন্টার"
                  : "Dhaka Medical College Hospital — Emergency & Trauma Centre"}
              </h2>
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                <span>{isBn ? "লাইভ ট্রমা স্ট্রিম" : "Live Trauma Stream"}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? "ইনবাউন্ড প্রি-অ্যারাইভাল কিউ • সরাসরি রিসাসিটেশন বে বরাদ্দ"
                : "Autonomous Inbound Pre-Arrival Queue • Direct-to-Bay Resuscitation Handoff"}
            </p>
          </div>
        </div>

        {/* ER Capacity Metrics */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          <div className="bg-[#07090e] px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              {isBn ? "ট্রমা বে ধারণক্ষমতা" : "Trauma Bed Capacity"}
            </span>
            <span className="text-amber-400 font-bold font-mono text-sm">18 / 22 (82%)</span>
          </div>
          <div className="bg-[#07090e] px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              {isBn ? "আগত অ্যাম্বুলেন্স" : "Inbound Ambulances"}
            </span>
            <span className="text-red-400 font-bold font-mono text-sm flex items-center justify-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-bounce" /> 2 Active
            </span>
          </div>
          <div className="bg-[#07090e] px-3.5 py-2 rounded-xl border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              {isBn ? "গড় ইনটেক সময়" : "Avg Door-to-Doctor"}
            </span>
            <span className="text-emerald-400 font-bold font-mono text-sm">3.8 Mins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Inbound Queue & Bay Allocator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Inbound Ambulance Cards */}
          <div className="bg-[#0f1420] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-red-400" />
                <span>{isBn ? "ইনবাউন্ড প্রি-অ্যারাইভাল কিউ" : "Inbound Pre-Arrival Queue"} ({queue.length})</span>
              </h3>
              <span className="text-[10px] text-teal-400 font-mono">Live Telemetry</span>
            </div>

            <div className="space-y-2.5">
              {queue.map((c) => {
                const isSelected = selectedCaseId === c.patientId;
                const isHighUrgency = c.esiLevel <= 2;
                return (
                  <div
                    key={c.patientId}
                    onClick={() => {
                      setSelectedCaseId(c.patientId);
                      setIsAccepted(false);
                      onSelectCase?.(c);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col gap-2 ${
                      isSelected
                        ? "bg-slate-800/90 border-teal-500 shadow-md ring-1 ring-teal-500/40"
                        : "bg-[#07090e]/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isHighUrgency ? "bg-red-600 text-white" : "bg-amber-500 text-slate-950"
                          }`}
                        >
                          ESI Level {c.esiLevel}
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{c.patientId}</span>
                        <span className="text-[10px] text-slate-400">({c.ambulanceId})</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded-full font-mono">
                        <Clock className="w-3 h-3 animate-spin" /> ETA: {c.etaMinutes}m
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium line-clamp-1">
                      {c.chiefComplaint}
                    </p>
                    <p className="text-[11px] text-slate-400 italic line-clamp-1">
                      "{c.chiefComplaintBn}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Target: <strong className="text-teal-300">{c.assignedBay}</strong></span>
                      <span className="text-amber-300 font-mono">NEWS2: {c.news2Score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Bay Allocation Grid */}
          <div className="bg-[#0f1420] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-teal-400" />
                <span>{isBn ? "ইমার্জেন্সি বে বরাদ্দ ও অবস্থা" : "ER Bay Allocation Status"}</span>
              </h3>
              <span className="text-[10px] text-emerald-400">Auto-Assigned via ESI</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Resus Bays (ESI 1-2) */}
              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 text-[11px]">Resus Bay 1</span>
                  <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">OCCUPIED</span>
                </div>
                <p className="text-[10px] text-slate-400">Cardiac Arrest (Code Blue)</p>
              </div>

              <div
                className={`p-2.5 rounded-xl border space-y-1 transition ${
                  isAccepted
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                    : "bg-red-900/40 border-red-500 text-white animate-pulse"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">Resus Bay 2</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      isAccepted ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                    }`}
                  >
                    {isAccepted ? "CONFIRMED" : "RESERVED"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  {currentCase.patientId} (ETA {currentCase.etaMinutes}m)
                </p>
              </div>

              {/* Acute Bays (ESI 3) */}
              <div className="p-2.5 rounded-xl bg-[#07090e]/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px]">Acute Bay 3</span>
                  <span className="text-[9px] bg-emerald-600/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold">AVAILABLE</span>
                </div>
                <p className="text-[10px] text-slate-500">Ready for Bedding</p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-[11px]">Acute Bay 4</span>
                  <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">RESERVED</span>
                </div>
                <p className="text-[10px] text-slate-400">HB-8091 (Trauma Fracture)</p>
              </div>

              {/* Fast Track / Ambulatory Bays (ESI 4-5) */}
              <div className="p-2.5 rounded-xl bg-[#07090e]/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px]">Fast Track 5</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">CLEANING</span>
                </div>
                <p className="text-[10px] text-slate-500">Turnaround in 5 mins</p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#07090e]/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px]">Fast Track 6</span>
                  <span className="text-[9px] bg-emerald-600/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold">AVAILABLE</span>
                </div>
                <p className="text-[10px] text-slate-500">Minor Lacerations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Case Clinical Dossier & Nurse Orders (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0f1420] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            {/* Dossier Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {isBn ? "রোগীর ক্লিনিক্যাল ডসিয়ার:" : "Inbound Case Dossier:"} {currentCase.patientId}
                  </h3>
                  <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {currentCase.assignedBay}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dispatched via {currentCase.dispatcher} • Reported {currentCase.timeReported}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#07090e] p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveTab("dossier")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      activeTab === "dossier" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    SBAR Dossier
                  </button>
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                      activeTab === "map" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" /> Inbound Map
                  </button>
                </div>

                <button
                  onClick={handleCopyFhir}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
                >
                  {copiedFhir ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFhir ? "FHIR Copied" : "Copy FHIR"}</span>
                </button>
              </div>
            </div>

            {/* Inbound Alert Banner */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                isAccepted
                  ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                  : "bg-red-950/50 border-red-500 text-red-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${isAccepted ? "text-emerald-400" : "text-red-400 animate-bounce"}`}
                />
                <span>
                  <strong>{isAccepted ? "Case Acknowledged & Bay Reserved:" : "Inbound Acute Triage Escalation:"}</strong>{" "}
                  {currentCase.chiefComplaint}. Patient landmark: {currentCase.landmark}.
                </span>
              </div>
              <span className="shrink-0 font-mono font-bold text-sm">
                ETA {currentCase.etaMinutes}m
              </span>
            </div>

            {/* Main Content Area: SBAR Dossier vs Inbound Telemetry Map */}
            {activeTab === "map" ? (
              <div className="pt-1">
                <DispatchMap
                  patientCoords={{ lat: 23.7258, lng: 90.3976 }}
                  severity={currentCase.severity}
                  autoAnimate={true}
                />
              </div>
            ) : (
              <>
                {/* SBAR Clinical Handoff Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Situation & Background */}
                  <div className="bg-[#07090e]/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-teal-400 uppercase tracking-wider block text-[10px]">
                      1. Situation & Chief Complaint (S)
                    </span>
                    <p className="text-white font-medium">{currentCase.chiefComplaint}</p>
                    <p className="text-slate-400 italic">"{currentCase.chiefComplaintBn}"</p>
                    <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
                      <span className="text-slate-500">Ambulance GPS:</span> Near Shaheed Minar / Bakshibazar Gate
                    </div>
                  </div>

                  {/* Objective Vitals */}
                  <div className="bg-[#07090e]/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-400 uppercase tracking-wider block text-[10px]">
                        2. Objective Field Vitals (O)
                      </span>
                      <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-1.5 py-0.5 rounded font-mono">
                        NEWS2: {currentCase.news2Score}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                      <div className="bg-[#0f1420] p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">HEART RATE</span>
                        <span className="text-red-400 font-bold">{currentCase.vitals.heartRate} bpm</span>
                      </div>
                      <div className="bg-[#0f1420] p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">BLOOD PRESS</span>
                        <span className="text-white font-bold">
                          {currentCase.vitals.systolicBp}/{currentCase.vitals.diastolicBp}
                        </span>
                      </div>
                      <div className="bg-[#0f1420] p-1.5 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">SpO2</span>
                        <span className="text-cyan-400 font-bold">{currentCase.vitals.spo2}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[11px]">
                      <div className="text-slate-400">RR: {currentCase.vitals.respiratoryRate}/min</div>
                      <div className="text-slate-400">Temp: {currentCase.vitals.tempCelsius}°C</div>
                      <div className="text-slate-400">AVPU: {currentCase.vitals.avpu}</div>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div className="bg-[#07090e]/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-teal-400 uppercase tracking-wider block text-[10px]">
                      3. Assessment & Clinical Triggers (A)
                    </span>
                    <p className="text-amber-300 font-medium">{currentCase.decisionFlipTrigger}</p>
                    <p className="text-[11px] text-slate-400">
                      Safety Protocol: Emergency care escalated directly. Stroke & Cardiac protocol active.
                    </p>
                  </div>

                  {/* Pre-Arrival Recommendation / Orders */}
                  <div className="bg-[#07090e]/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-teal-400 uppercase tracking-wider block text-[10px]">
                      4. Plan & ER Pathway (P)
                    </span>
                    <p className="text-emerald-300 font-medium">
                      Immediate ER Triage Bypass ➔ Direct to {currentCase.assignedBay}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Zero-Wait QR code scanned: Auto-assigns resuscitation team without desk delay.
                    </p>
                  </div>
                </div>

                {/* Scanned Pre-Hospital Medications & Contraindication Review */}
                {currentCase.medications && currentCase.medications.length > 0 && (
                  <div className="bg-[#07090e]/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-purple-400" />
                        <span>Field Scanned Medications & Contraindications</span>
                      </span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                        {currentCase.medications.length} drug(s) reported
                      </span>
                    </div>

                    <div className="space-y-2">
                      {currentCase.medications.map((med, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
                            med.is_contraindicated
                              ? "bg-red-950/40 border-red-500/60 text-red-200"
                              : "bg-[#0f1420] border-slate-800 text-slate-200"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{med.brand_name}</span>
                              <span className="text-teal-300 font-mono text-[11px]">
                                ({med.generic_name} {med.strength})
                              </span>
                              {med.is_contraindicated ? (
                                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <ShieldAlert className="w-2.5 h-2.5" /> CONTRAINDICATED
                                </span>
                              ) : (
                                <span className="bg-emerald-600/30 text-emerald-300 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                  SAFE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300">{med.clinical_alert_message}</p>
                          </div>

                          {med.er_prearrival_action && (
                            <div className="shrink-0 bg-[#07090e] px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] text-amber-300 font-mono">
                              <strong>TRAUMA BAY STAT:</strong> {med.er_prearrival_action}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nurse Pre-Arrival Preparedness Checklist */}
                <div className="bg-[#07090e]/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Nurse Pre-Arrival Bay Preparation Checklist</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      onClick={() => toggleCheck("ecg")}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                        checklist.ecg ? "bg-[#0f1420] border-teal-500/70 text-white" : "bg-[#07090e] border-slate-800 text-slate-400"
                      }`}
                    >
                      <input type="checkbox" checked={checklist.ecg} readOnly className="rounded accent-teal-500" />
                      <span>12-Lead ECG Machine in {currentCase.assignedBay}</span>
                    </label>

                    <label
                      onClick={() => toggleCheck("oxygen")}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                        checklist.oxygen ? "bg-[#0f1420] border-teal-500/70 text-white" : "bg-[#07090e] border-slate-800 text-slate-400"
                      }`}
                    >
                      <input type="checkbox" checked={checklist.oxygen} readOnly className="rounded accent-teal-500" />
                      <span>High-Flow O2 & Airway Kit on Standby</span>
                    </label>

                    <label
                      onClick={() => toggleCheck("ivAccess")}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                        checklist.ivAccess ? "bg-[#0f1420] border-teal-500/70 text-white" : "bg-[#07090e] border-slate-800 text-slate-400"
                      }`}
                    >
                      <input type="checkbox" checked={checklist.ivAccess} readOnly className="rounded accent-teal-500" />
                      <span>2x 18G Large-Bore IV Cannulas prepped</span>
                    </label>

                    <label
                      onClick={() => toggleCheck("cardiacStat")}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                        checklist.cardiacStat ? "bg-[#0f1420] border-teal-500/70 text-white" : "bg-[#07090e] border-slate-800 text-slate-400"
                      }`}
                    >
                      <input type="checkbox" checked={checklist.cardiacStat} readOnly className="rounded accent-teal-500" />
                      <span>Stat Troponin-I & CBC Blood Tubes ready</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* One-Click Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Wait Protocol: Patient bypasses registration desk directly to bay.</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsAccepted(true)}
                  disabled={isAccepted}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
                    isAccepted
                      ? "bg-emerald-600 text-white cursor-default"
                      : "bg-red-600 hover:bg-red-500 text-white"
                  }`}
                >
                  {isAccepted ? (
                    <>
                      <Check className="w-4 h-4" /> Case Accepted — Bay 2 Confirmed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Accept Inbound Case & Notify Ambulance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

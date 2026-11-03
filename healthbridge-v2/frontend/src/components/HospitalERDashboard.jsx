import React, { useState } from "react";
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
} from "lucide-react";

export default function HospitalERDashboard({ activeCase = null, onSelectCase }) {
  const [selectedCaseId, setSelectedCaseId] = useState("HB-8092");
  const [isAccepted, setIsAccepted] = useState(false);
  const [copiedFhir, setCopiedFhir] = useState(false);
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

  // Mock queue + dynamically synced active case from Patient View
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-red-600/20 border border-red-500/40 p-2.5 rounded-xl text-red-400">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Dhaka Medical College Hospital — Emergency & Trauma Centre
              </h2>
              <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span> Live Trauma Stream
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Inbound Pre-Arrival Queue • Direct-to-Bay Resuscitation Handoff
            </p>
          </div>
        </div>

        {/* ER Capacity Metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trauma Bed Capacity</span>
            <span className="text-amber-400 font-bold font-mono text-sm">18 / 22 (82%)</span>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Inbound Ambulances</span>
            <span className="text-red-400 font-bold font-mono text-sm flex items-center justify-center gap-1">
              <Activity className="w-3.5 h-3.5 animate-bounce" /> 2 Active
            </span>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-center">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Avg Door-to-Doctor</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">3.8 Mins</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Inbound Queue & Bay Allocator (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Inbound Ambulance Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-red-400" /> Inbound Pre-Arrival Queue ({queue.length})
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Live Telemetry</span>
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
                        ? "bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/40"
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isHighUrgency ? "bg-red-600 text-white" : "bg-amber-500 text-slate-950"
                        }`}>
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
                      <span>Target: <strong className="text-indigo-300">{c.assignedBay}</strong></span>
                      <span className="text-amber-300 font-mono">NEWS2: {c.news2Score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Bay Allocation Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-indigo-400" /> ER Bay Allocation Status
              </h3>
              <span className="text-[10px] text-emerald-400">Auto-Assigned via ESI</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Resus Bays (ESI 1-2) */}
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 text-[11px]">Resus Bay 1</span>
                  <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold">OCCUPIED</span>
                </div>
                <p className="text-[10px] text-slate-400">Cardiac Arrest (Code Blue)</p>
              </div>

              <div className={`p-2.5 rounded-lg border space-y-1 transition ${
                isAccepted
                  ? "bg-emerald-950/40 border-emerald-500 text-emerald-200"
                  : "bg-red-900/40 border-red-500 text-white animate-pulse"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">Resus Bay 2</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    isAccepted ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                  }`}>
                    {isAccepted ? "CONFIRMED" : "RESERVED"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  {currentCase.patientId} (ETA {currentCase.etaMinutes}m)
                </p>
              </div>

              {/* Acute Bays (ESI 3) */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px]">Acute Bay 3</span>
                  <span className="text-[9px] bg-emerald-600/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold">AVAILABLE</span>
                </div>
                <p className="text-[10px] text-slate-500">Ready for Bedding</p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-[11px]">Acute Bay 4</span>
                  <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">RESERVED</span>
                </div>
                <p className="text-[10px] text-slate-400">HB-8091 (Trauma Fracture)</p>
              </div>

              {/* Fast Track / Ambulatory Bays (ESI 4-5) */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px]">Fast Track 5</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">CLEANING</span>
                </div>
                <p className="text-[10px] text-slate-500">Turnaround in 5 mins</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            {/* Dossier Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Inbound Case Dossier: {currentCase.patientId}
                  </h3>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full font-mono font-medium">
                    {currentCase.assignedBay}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dispatched via {currentCase.dispatcher} • Reported {currentCase.timeReported}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyFhir}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                >
                  {copiedFhir ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedFhir ? "FHIR JSON Copied" : "Copy FHIR Packet"}
                </button>
              </div>
            </div>

            {/* Inbound Alert Banner */}
            <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
              isAccepted
                ? "bg-emerald-950/50 border-emerald-500 text-emerald-200"
                : "bg-red-950/50 border-red-500 text-red-200"
            }`}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${isAccepted ? "text-emerald-400" : "text-red-400 animate-bounce"}`} />
                <span>
                  <strong>{isAccepted ? "Case Acknowledged & Bay Reserved:" : "Inbound Acute Triage Escalation:"}</strong>{" "}
                  {currentCase.chiefComplaint}. Patient landmark: {currentCase.landmark}.
                </span>
              </div>
              <span className="shrink-0 font-mono font-bold text-sm">
                ETA {currentCase.etaMinutes}m
              </span>
            </div>

            {/* SBAR Clinical Handoff Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Situation & Background */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="font-bold text-indigo-400 uppercase tracking-wider block text-[10px]">
                  1. Situation & Chief Complaint (S)
                </span>
                <p className="text-white font-medium">{currentCase.chiefComplaint}</p>
                <p className="text-slate-400 italic">"{currentCase.chiefComplaintBn}"</p>
                <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="text-slate-500">Ambulance GPS:</span> Near Shaheed Minar / Bakshibazar Gate
                </div>
              </div>

              {/* Objective Vitals */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider block text-[10px]">
                    2. Objective Field Vitals (O)
                  </span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-1.5 py-0.5 rounded font-mono">
                    NEWS2: {currentCase.news2Score}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">HEART RATE</span>
                    <span className="text-red-400 font-bold">{currentCase.vitals.heartRate} bpm</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-500 block">BLOOD PRESS</span>
                    <span className="text-white font-bold">{currentCase.vitals.systolicBp}/{currentCase.vitals.diastolicBp}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
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

              {/* Assessment / Decision Flip Evidence */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="font-bold text-indigo-400 uppercase tracking-wider block text-[10px]">
                  3. Assessment & Decision Flip (A)
                </span>
                <p className="text-amber-300 font-medium">
                  {currentCase.decisionFlipTrigger}
                </p>
                <p className="text-[11px] text-slate-400">
                  Guardrail verified: Emergency care escalated rather than delayed. Stroke/Cardiac protocol active.
                </p>
              </div>

              {/* Pre-Arrival Recommendation / Orders */}
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <span className="font-bold text-indigo-400 uppercase tracking-wider block text-[10px]">
                  4. Plan & ER Pathway (P)
                </span>
                <p className="text-emerald-300 font-medium">
                  Immediate ER Triage Bypass ➔ Direct to {currentCase.assignedBay}
                </p>
                <p className="text-[11px] text-slate-400">
                  Zero-Wait QR code scanned: Auto-assigns resuscitation team without registration desk delay.
                </p>
              </div>
            </div>

            {/* Nurse Pre-Arrival Preparedness Checklist */}
            <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Nurse Pre-Arrival Bay Preparation Checklist
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label
                  onClick={() => toggleCheck("ecg")}
                  className={`p-2 rounded border cursor-pointer transition flex items-center gap-2 ${
                    checklist.ecg ? "bg-slate-900 border-indigo-500/70 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <input type="checkbox" checked={checklist.ecg} readOnly className="rounded accent-indigo-500" />
                  <span>12-Lead ECG Machine in {currentCase.assignedBay}</span>
                </label>

                <label
                  onClick={() => toggleCheck("oxygen")}
                  className={`p-2 rounded border cursor-pointer transition flex items-center gap-2 ${
                    checklist.oxygen ? "bg-slate-900 border-indigo-500/70 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <input type="checkbox" checked={checklist.oxygen} readOnly className="rounded accent-indigo-500" />
                  <span>High-Flow O2 & Airway Kit on Standby</span>
                </label>

                <label
                  onClick={() => toggleCheck("ivAccess")}
                  className={`p-2 rounded border cursor-pointer transition flex items-center gap-2 ${
                    checklist.ivAccess ? "bg-slate-900 border-indigo-500/70 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <input type="checkbox" checked={checklist.ivAccess} readOnly className="rounded accent-indigo-500" />
                  <span>2x 18G Large-Bore IV Cannulas prepped</span>
                </label>

                <label
                  onClick={() => toggleCheck("cardiacStat")}
                  className={`p-2 rounded border cursor-pointer transition flex items-center gap-2 ${
                    checklist.cardiacStat ? "bg-slate-900 border-indigo-500/70 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <input type="checkbox" checked={checklist.cardiacStat} readOnly className="rounded accent-indigo-500" />
                  <span>Stat Troponin-I & CBC Blood Tubes ready</span>
                </label>
              </div>
            </div>

            {/* One-Click Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Wait Protocol: Patient bypasses triage desk on arrival.</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsAccepted(true)}
                  disabled={isAccepted}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg ${
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

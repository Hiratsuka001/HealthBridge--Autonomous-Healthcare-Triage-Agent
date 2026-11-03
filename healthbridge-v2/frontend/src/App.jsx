import React, { useState } from "react";
import TriagePanel from "./components/TriagePanel";
import HospitalERDashboard from "./components/HospitalERDashboard";
import { Activity, Stethoscope, User, Bell, ShieldCheck } from "lucide-react";

const DEMO_PRESET = {
  steps: [
    {
      label: "1. Start: আমার মাথা ঘুরছে ও বুকে চাপ লাগছে (Dizzy with chest pressure)",
      text: "আমার হঠাৎ খুব মাথা ঘুরছে এবং বুকে প্রচণ্ড চাপ লাগছে (I suddenly feel very dizzy with severe chest pressure)",
    },
    {
      label: "2. Reply: বাম হাত অবশ লাগছে ও ঠান্ডা ঘাম হচ্ছে (Left arm numb & cold sweat)",
      text: "হ্যাঁ, আমার বাম হাত অবশ লাগছে এবং ঠান্ডা ঘাম বের হচ্ছে (Left arm is numb and sweating heavily)",
    },
  ],
};

export default function App() {
  // 'patient' (Field Emergency View) | 'hospital' (Hospital ER Trauma Console)
  const [persona, setPersona] = useState("patient");
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Main Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              HealthBridge
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                Dual-Persona Clinical System
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Autonomous Bilingual Prehospital Triage ⟷ Zero-Wait Hospital ER Trauma Console
            </p>
          </div>
        </div>

        {/* Persona Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setPersona("patient")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              persona === "patient"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> Patient / Field Emergency Cockpit
          </button>

          <button
            onClick={() => setPersona("hospital")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition relative ${
              persona === "hospital"
                ? "bg-red-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Hospital ER Trauma Console</span>
            {activeCase?.severity === "Severe" && (
              <span className="flex items-center gap-1 text-[10px] bg-red-950 text-red-200 border border-red-400/60 px-1.5 py-0.2 rounded-full font-mono animate-pulse">
                <Bell className="w-2.5 h-2.5 text-red-400" /> Inbound Alert
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {persona === "patient" ? (
          <div className="space-y-4">
            {/* Quick Context Banner */}
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Prehospital Patient Mode:</strong> Complete intake via the Interactive Body Map or Vitals, then watch how the Decision Flip Guardrail evaluates urgency and triggers direct ER voice dispatch.
                </span>
              </div>
              <button
                onClick={() => setPersona("hospital")}
                className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 px-2.5 py-1 rounded font-medium transition flex items-center gap-1"
              >
                <span>View Hospital ER Receiving Bay</span> &rarr;
              </button>
            </div>

            {/* Full-width 2-column Tele-Triage Cockpit */}
            <TriagePanel
              title="Autonomous Clinical Triage & Intake Cockpit"
              presetScenario={DEMO_PRESET}
              initialRegion="chest"
              onTriageComplete={handleTriageCompleted}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hospital Dashboard Header Banner */}
            <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-red-200">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>ER Clinician Console:</strong> Live inbound telemetry from field ambulances. Review SBAR notes, assign resuscitation bays, pre-order equipment, and export FHIR packets.
                </span>
              </div>
              <button
                onClick={() => setPersona("patient")}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1 rounded font-medium transition"
              >
                &larr; Return to Patient Emergency Cockpit
              </button>
            </div>

            {/* Hospital ER Trauma & Receiving Console */}
            <HospitalERDashboard activeCase={activeCase} />
          </div>
        )}
      </main>
    </div>
  );
}

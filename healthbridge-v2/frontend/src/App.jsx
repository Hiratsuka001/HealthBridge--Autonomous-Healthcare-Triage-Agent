import React, { useState } from "react";
import TriagePanel from "./components/TriagePanel";
import { Activity, Columns, User, ShieldCheck } from "lucide-react";

const ROUTINE_PRESET = {
  steps: [
    { label: "1. Start: আমার মাথা ঘুরছে (I feel dizzy)", text: "আমার সকাল থেকে মাথা ঘুরছে (I feel dizzy since morning)" },
    { label: "2. Reply: No chest pain, just skipped breakfast in heat", text: "না, বুকে কোনো ব্যথা নেই! সকাল থেকে রোদে ছিলাম আর নাস্তা করিনি (No chest pain, skipped breakfast in heat)" }
  ]
};

const CRITICAL_PRESET = {
  steps: [
    { label: "1. Start: আমার মাথা ঘুরছে (I feel dizzy)", text: "আমার হঠাৎ খুব মাথা ঘুরছে (I suddenly feel very dizzy) " },
    { label: "2. Reply: বুকে চাপ লাগছে এবং কথা জড়িয়ে যাচ্ছে (Chest pressure & slurred speech)", text: "হ্যাঁ, আমার বুকে প্রচণ্ড চাপ লাগছে এবং কথা জড়িয়ে আসছে (Severe chest pressure and slurred speech)" }
  ]
};

export default function App() {
  const [splitScreen, setSplitScreen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              HealthBridge
              <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">
                Missing-Question Engine + SAM 3.1
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Autonomous Bilingual Triage, Decision Flip Guardrail & Emergency Voice Dispatch
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setSplitScreen(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              !splitScreen ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" /> Single Triage
          </button>
          <button
            onClick={() => setSplitScreen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              splitScreen ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns className="w-3.5 h-3.5" /> Split-Screen "Decision Flip" Demo
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {splitScreen ? (
          <div className="space-y-4">
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs text-indigo-200">
              <div className="flex items-center gap-2.5 text-xs text-indigo-200">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>
                  <strong>Decision Flip Demo Mode:</strong> Both patients report <em>"I feel dizzy" (আমার মাথা ঘুরছে)</em>. Watch how the engine asks the exact missing critical question and branches them to completely different safe clinical pathways.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TriagePanel
                title="Case A: Dizziness (Dehydration Pathway)"
                presetScenario={ROUTINE_PRESET}
              />
              <TriagePanel
                title="Case B: Dizziness (Cardiac/Stroke Flip Pathway)"
                presetScenario={CRITICAL_PRESET}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <TriagePanel
              title="Live Bilingual Patient Triage"
              presetScenario={CRITICAL_PRESET}
            />
          </div>
        )}
      </main>
    </div>
  );
}

import React, { useState } from "react";
import { AlertCircle, Clock, CheckCircle2, PhoneCall, Brain } from "lucide-react";

export default function FASTStrokeCard({ onTriggerStrokeEscalation }) {
  const [fastResults, setFastResults] = useState({
    face: false,
    arms: false,
    speech: false,
  });

  const toggleParam = (param) => {
    setFastResults((prev) => ({ ...prev, [param]: !prev[param] }));
  };

  const isPositive = fastResults.face || fastResults.arms || fastResults.speech;

  const handleEscalate = () => {
    const findings = [];
    if (fastResults.face) findings.push("Facial Droop (মুখের এক পাশ অবশ/বেঁকে যাওয়া)");
    if (fastResults.arms) findings.push("Arm Drift (এক হাত দুর্বল হয়ে নিচে নেমে যাওয়া)");
    if (fastResults.speech) findings.push("Slurred Speech (কথা জড়িয়ে যাওয়া)");

    const summaryBn = `জরুরি স্ট্রোক সতর্কতা (FAST পজিটিভ): ${findings.join(", ")}`;
    const summaryEn = `Acute Stroke Alert (FAST Positive): ${findings.join(", ")}`;

    if (onTriggerStrokeEscalation) {
      onTriggerStrokeEscalation({
        summaryBn,
        summaryEn,
        fastResults,
      });
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all shadow-lg ${
      isPositive
        ? "bg-red-950/60 border-red-500/70 text-red-100"
        : "bg-slate-900 border-slate-800 text-slate-200"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isPositive ? "bg-red-600 text-white" : "bg-indigo-500/10 text-indigo-400"}`}>
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              FAST Stroke Rapid Assessment
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                isPositive ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300"
              }`}>
                {isPositive ? "🚨 POSITIVE RED FLAG" : "SCREENING"}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Cincinnati Prehospital Stroke Scale</p>
          </div>
        </div>
      </div>

      {/* FAST 3-Point Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mb-3">
        {/* F - Face */}
        <div
          onClick={() => toggleParam("face")}
          className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
            fastResults.face
              ? "bg-red-900/60 border-red-500 text-white shadow"
              : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-red-400">F • Face Drooping</span>
              {fastResults.face ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-slate-600" />}
            </div>
            <p className="text-[11px] font-medium mt-1">হাসতে বললে মুখের এক পাশ কি বেঁকে যায়?</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Uneven smile / facial asymmetry</p>
          </div>
          <span className={`text-[10px] mt-2 font-bold px-1.5 py-0.5 rounded w-max ${
            fastResults.face ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"
          }`}>
            {fastResults.face ? "FAIL (Droop)" : "PASS (Normal)"}
          </span>
        </div>

        {/* A - Arms */}
        <div
          onClick={() => toggleParam("arms")}
          className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
            fastResults.arms
              ? "bg-red-900/60 border-red-500 text-white shadow"
              : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-red-400">A • Arm Weakness</span>
              {fastResults.arms ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-slate-600" />}
            </div>
            <p className="text-[11px] font-medium mt-1">দুই হাত সামনে তুললে এক হাত কি পড়ে যায়?</p>
            <p className="text-[10px] text-slate-400 mt-0.5">One arm drifts downwards</p>
          </div>
          <span className={`text-[10px] mt-2 font-bold px-1.5 py-0.5 rounded w-max ${
            fastResults.arms ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"
          }`}>
            {fastResults.arms ? "FAIL (Drift)" : "PASS (Normal)"}
          </span>
        </div>

        {/* S - Speech */}
        <div
          onClick={() => toggleParam("speech")}
          className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
            fastResults.speech
              ? "bg-red-900/60 border-red-500 text-white shadow"
              : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-red-400">S • Slurred Speech</span>
              {fastResults.speech ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-slate-600" />}
            </div>
            <p className="text-[11px] font-medium mt-1">কথা কি অস্পষ্ট বা জড়িয়ে যাচ্ছে?</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Slurred, aphasic, or unable to speak</p>
          </div>
          <span className={`text-[10px] mt-2 font-bold px-1.5 py-0.5 rounded w-max ${
            fastResults.speech ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400"
          }`}>
            {fastResults.speech ? "FAIL (Slurred)" : "PASS (Clear)"}
          </span>
        </div>
      </div>

      {/* T - Time / Escalation Action */}
      {isPositive ? (
        <div className="bg-red-950/80 border border-red-500/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">T • Time is Brain! Suspected Acute Stroke (CVA)</p>
              <p className="text-[11px] text-red-200">
                Thrombolysis window is &lt; 4.5 hours. Immediate neurological ER transfer required.
              </p>
            </div>
          </div>
          <button
            onClick={handleEscalate}
            className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <PhoneCall className="w-4 h-4" /> Trigger Immediate Severe Triage & Dispatch
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400 italic text-center">
          Tap any of the 3 tests above if the patient shows sudden neurological symptoms.
        </p>
      )}
    </div>
  );
}

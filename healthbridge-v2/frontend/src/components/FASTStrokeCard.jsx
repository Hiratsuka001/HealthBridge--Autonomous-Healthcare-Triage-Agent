import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Brain, PhoneCall, ShieldAlert } from "lucide-react";

export default function FASTStrokeCard({ onTriggerStrokeEscalation, lang = "bn" }) {
  const [fastResults, setFastResults] = useState({
    face: false,
    arms: false,
    speech: false,
  });

  const toggleParam = (param) => {
    setFastResults((prev) => ({ ...prev, [param]: !prev[param] }));
  };

  const isPositive = fastResults.face || fastResults.arms || fastResults.speech;
  const isBn = lang === "bn";

  const handleEscalate = () => {
    const findings = [];
    if (fastResults.face) findings.push(isBn ? "মুখের এক পাশ অবশ/বেঁকে যাওয়া (Facial Droop)" : "Facial Droop");
    if (fastResults.arms) findings.push(isBn ? "এক হাত অবশ বা দুর্বল (Arm Drift)" : "Arm Drift");
    if (fastResults.speech) findings.push(isBn ? "কথা জড়িয়ে যাওয়া (Slurred Speech)" : "Slurred Speech");

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
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
        isPositive
          ? "bg-red-50/90 border-red-300 text-red-950"
          : "bg-white border-slate-200/90 text-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl transition-colors ${
              isPositive ? "bg-red-600 text-white" : "bg-teal-50 text-teal-700 border border-teal-200/70"
            }`}
          >
            <Brain className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <span>{isBn ? "জরুরি স্ট্রোক স্ক্রিনিং (FAST টেস্ট)" : "FAST Stroke Rapid Assessment"}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isPositive ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {isPositive
                  ? isBn ? "🚨 জরুরি বিপদ সংকেত" : "🚨 POSITIVE RED FLAG"
                  : isBn ? "স্ক্রিনিং মোড" : "SCREENING"}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {isBn
                ? "সিনসিনাটি প্রিহসপিটাল স্ট্রোক স্কেল (CPSS) — সময় অত্যন্ত মূল্যবান"
                : "Cincinnati Prehospital Stroke Scale — Time is Brain"}
            </p>
          </div>
        </div>
      </div>

      {/* FAST 3-Point Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* F - Face */}
        <div
          onClick={() => toggleParam("face")}
          className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            fastResults.face
              ? "bg-red-100/80 border-red-400 text-red-950 shadow-xs"
              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-bold text-xs">
              <span className={fastResults.face ? "text-red-700" : "text-slate-800"}>
                {isBn ? "F • মুখমণ্ডল (Face Droop)" : "F • Face Drooping"}
              </span>
              {fastResults.face ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-xs font-semibold mt-1.5 leading-snug">
              {isBn ? "হাসতে বললে কি মুখের এক পাশ বেঁকে যায়?" : "Does one side of the face droop when smiling?"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? "Uneven smile / facial numbness" : "Asymmetric smile or numbness"}
            </p>
          </div>
          <span
            className={`text-[10px] mt-2.5 font-bold px-2 py-0.5 rounded-full w-max ${
              fastResults.face ? "bg-red-600 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {fastResults.face ? (isBn ? "পজিটিভ (অস্বাভাবিক)" : "FAIL (Droop)") : (isBn ? "স্বাভাবিক" : "NORMAL")}
          </span>
        </div>

        {/* A - Arms */}
        <div
          onClick={() => toggleParam("arms")}
          className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            fastResults.arms
              ? "bg-red-100/80 border-red-400 text-red-950 shadow-xs"
              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-bold text-xs">
              <span className={fastResults.arms ? "text-red-700" : "text-slate-800"}>
                {isBn ? "A • হাতের শক্তি (Arm Weakness)" : "A • Arm Weakness"}
              </span>
              {fastResults.arms ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-xs font-semibold mt-1.5 leading-snug">
              {isBn ? "দুই হাত সামনে তুললে কি এক হাত নিচে নেমে পড়ে?" : "Does one arm drift downwards when raised?"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? "One arm drifts downwards" : "Unilateral arm weakness"}
            </p>
          </div>
          <span
            className={`text-[10px] mt-2.5 font-bold px-2 py-0.5 rounded-full w-max ${
              fastResults.arms ? "bg-red-600 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {fastResults.arms ? (isBn ? "পজিটিভ (দুর্বলতা)" : "FAIL (Drift)") : (isBn ? "স্বাভাবিক" : "NORMAL")}
          </span>
        </div>

        {/* S - Speech */}
        <div
          onClick={() => toggleParam("speech")}
          className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
            fastResults.speech
              ? "bg-red-100/80 border-red-400 text-red-950 shadow-xs"
              : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
          }`}
        >
          <div>
            <div className="flex items-center justify-between font-bold text-xs">
              <span className={fastResults.speech ? "text-red-700" : "text-slate-800"}>
                {isBn ? "S • কথা বলা (Speech Difficulty)" : "S • Slurred Speech"}
              </span>
              {fastResults.speech ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-xs font-semibold mt-1.5 leading-snug">
              {isBn ? "কথা কি অস্পষ্ট, জড়িয়ে যাওয়া বা বন্ধ হয়ে গেছে?" : "Is speech slurred or words hard to repeat?"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isBn ? "Slurred, aphasic, or unable to speak" : "Speech difficulty or aphasia"}
            </p>
          </div>
          <span
            className={`text-[10px] mt-2.5 font-bold px-2 py-0.5 rounded-full w-max ${
              fastResults.speech ? "bg-red-600 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {fastResults.speech ? (isBn ? "পজিটিভ (অস্পষ্ট)" : "FAIL (Speech)") : (isBn ? "স্বাভাবিক" : "NORMAL")}
          </span>
        </div>
      </div>

      {/* Escalation Button if Positive */}
      {isPositive && (
        <div className="p-3.5 bg-red-600 rounded-xl text-white flex flex-wrap items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold text-xs">
                {isBn
                  ? "স্ট্রোকের ঝুঁকি নিশ্চিত হয়েছে (T - Time to call 999)!"
                  : "Critical Acute Stroke Window (T - Time to call 999)!"}
              </p>
              <p className="text-[11px] text-red-100">
                {isBn
                  ? "রোগীকে অবিলম্বে স্ট্রোক সেন্টারে পাঠাতে জরুরি অ্যাম্বুলেন্স সক্রিয় করুন।"
                  : "Immediate CT/MRI and thrombolysis required within the golden hour."}
              </p>
            </div>
          </div>
          <button
            onClick={handleEscalate}
            className="px-3.5 py-1.5 bg-white text-red-700 hover:bg-red-50 rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{isBn ? "জরুরি ট্রায়াজে স্ট্রোক পাঠান" : "Escalate to Stroke Emergency"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

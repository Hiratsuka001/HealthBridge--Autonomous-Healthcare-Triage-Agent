import React, { useState, useEffect, useMemo } from "react";
import { calculateNews2, calculateEsi } from "../utils/clinicalCalculators";
import { PRESETS } from "../utils/vitalsPresets";
import { Heart, Wind, Gauge, Thermometer, ShieldAlert, Zap, Award } from "lucide-react";

export default function VitalsBar({ onVitalsChange, hasHighRiskSymptom = false, lang = "bn" }) {
  const [vitals, setVitals] = useState(PRESETS.normal.vitals);

  // Derive scoring purely during render
  const scoring = useMemo(() => {
    const news = calculateNews2(vitals);
    const esi = calculateEsi({
      news2Score: news.score,
      ...vitals,
      hasHighRiskSymptom,
    });
    return { news, esi };
  }, [vitals, hasHighRiskSymptom]);

  // Synchronize with parent callback
  useEffect(() => {
    onVitalsChange?.(vitals, scoring);
  }, [vitals, scoring, onVitalsChange]);

  const updateVital = (field, val) => {
    setVitals((prev) => ({ ...prev, [field]: val }));
  };

  const loadPreset = (presetKey) => {
    if (PRESETS[presetKey]) {
      setVitals(PRESETS[presetKey].vitals);
    }
  };

  const isBn = lang === "bn";

  const getScoreBadgeColor = (risk) => {
    if (risk === "High") return "bg-red-50 text-red-800 border-red-200";
    if (risk === "Medium") return "bg-amber-50 text-amber-800 border-amber-200";
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
      {/* Header & Rapid Scenario Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 rounded-xl text-teal-700 border border-teal-200/70">
            <Gauge className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {isBn ? "ক্লিনিক্যাল ভাইটাল ও জরুরি ঝুঁকি মূল্যায়ন" : "Clinical Vitals & Risk Scoring"}
              <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-medium">
                NEWS2 + ESI
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? "রয়্যাল কলেজ অফ ফিজিশিয়ানস মানদণ্ড অনুযায়ী তাৎক্ষণিক ঝুঁকি নির্ধারণ"
                : "Royal College of Physicians Emergency Protocol"}
            </p>
          </div>
        </div>

        {/* Rapid Clinical Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium">
            {isBn ? "নমুনা লক্ষণ:" : "Presets:"}
          </span>
          {Object.keys(PRESETS).map((key) => {
            const p = PRESETS[key];
            return (
              <button
                key={key}
                onClick={() => loadPreset(key)}
                className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition flex items-center gap-1 font-medium shadow-xs"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Calculated Risk Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* NEWS2 Score Card */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between ${getScoreBadgeColor(scoring.news.riskLevel)} shadow-xs`}>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>NEWS2 Score: {scoring.news.score} / 20</span>
            </div>
            <p className="text-xs mt-0.5 font-medium opacity-90">{scoring.news.clinicalUrgency}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-white/90 border border-current shadow-xs">
            {scoring.news.riskLevel} {isBn ? "ঝুঁকি" : "Risk"}
          </span>
        </div>

        {/* ESI Triage Level Card */}
        <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-900 flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-teal-800">
              <Award className="w-4 h-4 text-teal-600" />
              <span>{scoring.esi.name}</span>
            </div>
            <p className="text-xs mt-0.5 text-teal-700/80 font-medium">
              {isBn ? "প্রস্তাবিত সময়সীমা:" : "Target window:"} {scoring.esi.target}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase bg-teal-700 text-white shadow-xs">
            ESI Level {scoring.esi.level}
          </span>
        </div>
      </div>

      {/* Vitals Input Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {/* Heart Rate */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
          <label className="text-xs text-slate-600 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
              <span>{isBn ? "পালস রেট" : "Heart Rate"}</span>
            </span>
            <span className="text-slate-900 font-bold font-mono">{vitals.heartRate} bpm</span>
          </label>
          <input
            type="range"
            min="30"
            max="180"
            value={vitals.heartRate}
            onChange={(e) => updateVital("heartRate", parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>&lt;50</span>
            <span>Normal</span>
            <span>&gt;110</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
          <label className="text-xs text-slate-600 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-sky-600" />
              <span>{isBn ? "অক্সিজেন" : "SpO2"}</span>
            </span>
            <span className={`font-bold font-mono ${vitals.spo2 <= 92 ? "text-red-600" : "text-slate-900"}`}>
              {vitals.spo2}%
            </span>
          </label>
          <input
            type="range"
            min="75"
            max="100"
            value={vitals.spo2}
            onChange={(e) => updateVital("spo2", parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>&lt;92 Crit</span>
            <span>Normal 96+</span>
          </div>
        </div>

        {/* Systolic BP */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
          <label className="text-xs text-slate-600 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isBn ? "রক্তচাপ" : "Systolic BP"}</span>
            </span>
            <span className={`font-bold font-mono ${vitals.systolicBp >= 160 || vitals.systolicBp <= 90 ? "text-red-600" : "text-slate-900"}`}>
              {vitals.systolicBp}
            </span>
          </label>
          <input
            type="range"
            min="60"
            max="220"
            value={vitals.systolicBp}
            onChange={(e) => updateVital("systolicBp", parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>&lt;90 Shock</span>
            <span>&gt;160 High</span>
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
          <label className="text-xs text-slate-600 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-teal-600" />
              <span>{isBn ? "শ্বাস প্রশ্বাস" : "Resp. Rate"}</span>
            </span>
            <span className={`font-bold font-mono ${vitals.respiratoryRate >= 25 ? "text-red-600" : "text-slate-900"}`}>
              {vitals.respiratoryRate}/m
            </span>
          </label>
          <input
            type="range"
            min="8"
            max="45"
            value={vitals.respiratoryRate}
            onChange={(e) => updateVital("respiratoryRate", parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>12-20 Norm</span>
            <span>&gt;25 Tachypnea</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
          <label className="text-xs text-slate-600 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              <span>{isBn ? "তাপমাত্রা" : "Temp"}</span>
            </span>
            <span className="text-slate-900 font-bold font-mono">{vitals.tempCelsius}°C</span>
          </label>
          <input
            type="range"
            min="340"
            max="410"
            value={Math.round(vitals.tempCelsius * 10)}
            onChange={(e) => updateVital("tempCelsius", parseFloat((e.target.value / 10).toFixed(1)))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>&lt;35°C</span>
            <span>37°C Norm</span>
            <span>&gt;39°C</span>
          </div>
        </div>

        {/* Consciousness (AVPU) */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
          <label className="text-xs text-slate-600 font-semibold flex items-center justify-between">
            <span>{isBn ? "জ্ঞান / সচেতনতা" : "Conscious (AVPU)"}</span>
            <span className={`font-bold ${vitals.avpu !== "Alert" ? "text-red-600" : "text-slate-900"}`}>
              {vitals.avpu}
            </span>
          </label>
          <select
            value={vitals.avpu}
            onChange={(e) => updateVital("avpu", e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 font-medium focus:outline-none focus:border-teal-500 shadow-xs"
          >
            <option value="Alert">Alert (সজাগ)</option>
            <option value="Voice">Voice (ডাকে সাড়া দেয়)</option>
            <option value="Pain">Pain (ব্যথায় সাড়া দেয়)</option>
            <option value="Unresponsive">Unresponsive (অজ্ঞান)</option>
          </select>
          <div className="text-[10px] text-slate-400">
            {vitals.avpu !== "Alert" ? "High Risk Neuro alert" : "Normal cognition"}
          </div>
        </div>
      </div>
    </div>
  );
}

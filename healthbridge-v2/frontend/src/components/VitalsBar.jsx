import React, { useState, useEffect, useMemo } from "react";
import { calculateNews2, calculateEsi } from "../utils/clinicalCalculators";
import { PRESETS } from "../utils/vitalsPresets";
import { Heart, Wind, Gauge, Thermometer, ShieldAlert, Zap, Award } from "lucide-react";

export default function VitalsBar({ onVitalsChange, hasHighRiskSymptom = false }) {
  const [vitals, setVitals] = useState(PRESETS.normal.vitals);

  // Derive scoring purely during render
  const scoring = useMemo(() => {
    const news = calculateNews2(vitals);
    const esi = calculateEsi({
      news2Score: news.score,
      ...vitals,
      hasHighRiskSymptom
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

  const getScoreBadgeColor = (risk) => {
    if (risk === "High") return "bg-red-500/20 text-red-300 border-red-500/50";
    if (risk === "Medium") return "bg-amber-500/20 text-amber-300 border-amber-500/50";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-lg">
      {/* Header & Preset Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Clinical Vitals & Risk Scoring
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono font-medium">
                NEWS2 + ESI Level 1-5
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Royal College of Physicians emergency protocol</p>
          </div>
        </div>

        {/* Rapid Scenario Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
          {Object.keys(PRESETS).map((key) => {
            const p = PRESETS[key];
            return (
              <button
                key={key}
                onClick={() => loadPreset(key)}
                className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-700 transition flex items-center gap-1"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Calculated Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* NEWS2 Card */}
        <div className={`p-3 rounded-lg border flex items-center justify-between ${getScoreBadgeColor(scoring.news.riskLevel)}`}>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> NEWS2 Score: {scoring.news.score} / 20
            </div>
            <p className="text-[11px] mt-0.5 font-medium">{scoring.news.clinicalUrgency}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-bold uppercase bg-slate-950/60 border border-current">
            {scoring.news.riskLevel} Risk
          </span>
        </div>

        {/* ESI Triage Level Card */}
        <div className="p-3 rounded-lg border border-indigo-500/40 bg-indigo-950/30 text-indigo-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-indigo-300">
              <Award className="w-4 h-4 text-indigo-400" /> {scoring.esi.name}
            </div>
            <p className="text-[11px] mt-0.5 text-slate-300 font-medium">Target: {scoring.esi.target}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-bold uppercase bg-indigo-600 text-white shadow-sm">
            ESI-{scoring.esi.level}
          </span>
        </div>
      </div>

      {/* Vitals Input Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
        {/* Heart Rate */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> Heart Rate</span>
            <span className="text-white font-bold">{vitals.heartRate} bpm</span>
          </label>
          <input
            type="range"
            min="30"
            max="180"
            value={vitals.heartRate}
            onChange={(e) => updateVital("heartRate", parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>Brady &lt;50</span>
            <span>Normal</span>
            <span>Tachy &gt;110</span>
          </div>
        </div>

        {/* SpO2 */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-cyan-400" /> SpO2</span>
            <span className={`font-bold ${vitals.spo2 <= 92 ? "text-red-400" : "text-white"}`}>{vitals.spo2}%</span>
          </label>
          <input
            type="range"
            min="75"
            max="100"
            value={vitals.spo2}
            onChange={(e) => updateVital("spo2", parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>Hypoxia &le;91%</span>
            <span>Target &ge;96%</span>
          </div>
        </div>

        {/* Blood Pressure (Systolic) */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1"><Gauge className="w-3 h-3 text-amber-400" /> Systolic BP</span>
            <span className="text-white font-bold">{vitals.systolicBp} mmHg</span>
          </label>
          <input
            type="range"
            min="60"
            max="230"
            value={vitals.systolicBp}
            onChange={(e) => updateVital("systolicBp", parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>Shock &lt;90</span>
            <span>120</span>
            <span>Crisis &gt;180</span>
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-indigo-400" /> Resp Rate</span>
            <span className="text-white font-bold">{vitals.respiratoryRate} /min</span>
          </label>
          <input
            type="range"
            min="6"
            max="40"
            value={vitals.respiratoryRate}
            onChange={(e) => updateVital("respiratoryRate", parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>&lt;8</span>
            <span>12-20</span>
            <span>&gt;25</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1">
          <label className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-rose-400" /> Temp</span>
            <span className="text-white font-bold">{vitals.tempCelsius}°C</span>
          </label>
          <input
            type="range"
            min="34.0"
            max="41.5"
            step="0.1"
            value={vitals.tempCelsius}
            onChange={(e) => updateVital("tempCelsius", parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>Hypo &lt;35°</span>
            <span>37.0°</span>
            <span>Fever &gt;38.5°</span>
          </div>
        </div>

        {/* AVPU Consciousness */}
        <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 flex flex-col gap-1 justify-between">
          <label className="text-[10px] text-slate-400 font-medium">AVPU Mental State</label>
          <div className="grid grid-cols-2 gap-1">
            {["Alert", "Voice", "Pain", "Unresponsive"].map((state) => {
              const active = vitals.avpu.toLowerCase() === state.toLowerCase();
              return (
                <button
                  key={state}
                  onClick={() => updateVital("avpu", state)}
                  className={`text-[9px] py-1 px-1 rounded font-bold transition text-center ${
                    active
                      ? state === "Alert"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {state[0]} ({state.slice(0, 4)})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pain Scale Bar (0 to 10) */}
      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Wong-Baker Pain Scale (0-10):</span>
          <span className="text-xs font-bold text-amber-300">Level {vitals.painLevel}/10</span>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const active = vitals.painLevel === num;
            const getColor = (n) => {
              if (n === 0) return active ? "bg-emerald-600 text-white" : "text-emerald-400";
              if (n <= 3) return active ? "bg-blue-600 text-white" : "text-blue-400";
              if (n <= 6) return active ? "bg-amber-600 text-white" : "text-amber-400";
              return active ? "bg-red-600 text-white" : "text-red-400";
            };
            return (
              <button
                key={num}
                onClick={() => updateVital("painLevel", num)}
                className={`w-6 h-6 rounded text-xs font-bold transition flex items-center justify-center border ${
                  active
                    ? `${getColor(num)} border-white shadow-sm`
                    : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

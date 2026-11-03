import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { BODY_REGIONS } from "../utils/bodyRegions";

export default function BodyMap({ onSelectSymptom, activeRegionId = "chest" }) {
  const [selectedRegion, setSelectedRegion] = useState(activeRegionId);
  const region = BODY_REGIONS[selectedRegion] || BODY_REGIONS.chest;

  const handleRegionClick = (id) => {
    setSelectedRegion(id);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Interactive Body Map
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                Symptom Locator
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Tap anatomical zone to surface clinical red flags</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Anatomical SVG Silhouette */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 relative">
          <svg
            viewBox="0 0 200 340"
            className="w-44 h-72 select-none filter drop-shadow-[0_0_10px_rgba(99,102,241,0.15)]"
          >
            {/* Background Grid Lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="200" height="340" fill="url(#grid)" />

            {/* HEAD */}
            <g
              onClick={() => handleRegionClick("head")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <ellipse
                cx="100"
                cy="38"
                rx="24"
                ry="28"
                className={`transition-colors ${
                  selectedRegion === "head"
                    ? "fill-indigo-600 stroke-indigo-400 stroke-2"
                    : "fill-slate-800/90 stroke-slate-700 hover:fill-indigo-950/70"
                }`}
              />
              <text x="100" y="42" textAnchor="middle" className="text-[10px] fill-slate-300 pointer-events-none font-bold">
                HEAD
              </text>
            </g>

            {/* AIRWAY / NECK */}
            <g
              onClick={() => handleRegionClick("airway")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <rect
                x="90"
                y="68"
                width="20"
                height="16"
                rx="3"
                className={`transition-colors ${
                  selectedRegion === "airway"
                    ? "fill-indigo-600 stroke-indigo-400 stroke-2"
                    : "fill-slate-800/90 stroke-slate-700 hover:fill-indigo-950/70"
                }`}
              />
            </g>

            {/* CHEST & HEART */}
            <g
              onClick={() => handleRegionClick("chest")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <path
                d="M 65 86 L 135 86 L 128 142 L 72 142 Z"
                className={`transition-colors ${
                  selectedRegion === "chest"
                    ? "fill-red-600/90 stroke-red-400 stroke-2"
                    : "fill-slate-800/90 stroke-slate-700 hover:fill-red-950/70"
                }`}
              />
              <text x="100" y="118" textAnchor="middle" className="text-[11px] fill-white pointer-events-none font-bold">
                CHEST
              </text>
            </g>

            {/* ABDOMEN */}
            <g
              onClick={() => handleRegionClick("abdomen")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <path
                d="M 72 145 L 128 145 L 124 185 L 76 185 Z"
                className={`transition-colors ${
                  selectedRegion === "abdomen"
                    ? "fill-amber-600/90 stroke-amber-400 stroke-2"
                    : "fill-slate-800/90 stroke-slate-700 hover:fill-amber-950/70"
                }`}
              />
              <text x="100" y="168" textAnchor="middle" className="text-[10px] fill-slate-200 pointer-events-none font-bold">
                ABDOMEN
              </text>
            </g>

            {/* PELVIS */}
            <g
              onClick={() => handleRegionClick("pelvis")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <path
                d="M 76 188 L 124 188 L 115 212 L 85 212 Z"
                className={`transition-colors ${
                  selectedRegion === "pelvis"
                    ? "fill-purple-600/90 stroke-purple-400 stroke-2"
                    : "fill-slate-800/90 stroke-slate-700 hover:fill-purple-950/70"
                }`}
              />
              <text x="100" y="202" textAnchor="middle" className="text-[8px] fill-slate-300 pointer-events-none font-medium">
                PELVIS
              </text>
            </g>

            {/* LEFT & RIGHT ARMS (LIMBS) */}
            <g
              onClick={() => handleRegionClick("limbs")}
              className="cursor-pointer transition-all duration-200 group"
            >
              {/* Left Arm */}
              <path
                d="M 62 90 L 42 160 L 32 205 L 42 208 L 52 165 L 68 100 Z"
                className={`transition-colors ${
                  selectedRegion === "limbs"
                    ? "fill-blue-600/90 stroke-blue-400 stroke-2"
                    : "fill-slate-800/80 stroke-slate-700 hover:fill-blue-950/70"
                }`}
              />
              {/* Right Arm */}
              <path
                d="M 138 90 L 158 160 L 168 205 L 158 208 L 148 165 L 132 100 Z"
                className={`transition-colors ${
                  selectedRegion === "limbs"
                    ? "fill-blue-600/90 stroke-blue-400 stroke-2"
                    : "fill-slate-800/80 stroke-slate-700 hover:fill-blue-950/70"
                }`}
              />
            </g>

            {/* LEGS (LIMBS) */}
            <g
              onClick={() => handleRegionClick("limbs")}
              className="cursor-pointer transition-all duration-200 group"
            >
              {/* Left Leg */}
              <path
                d="M 83 215 L 75 280 L 72 328 L 84 328 L 92 280 L 98 215 Z"
                className={`transition-colors ${
                  selectedRegion === "limbs"
                    ? "fill-blue-600/90 stroke-blue-400 stroke-2"
                    : "fill-slate-800/80 stroke-slate-700 hover:fill-blue-950/70"
                }`}
              />
              {/* Right Leg */}
              <path
                d="M 117 215 L 125 280 L 128 328 L 116 328 L 108 280 L 102 215 Z"
                className={`transition-colors ${
                  selectedRegion === "limbs"
                    ? "fill-blue-600/90 stroke-blue-400 stroke-2"
                    : "fill-slate-800/80 stroke-slate-700 hover:fill-blue-950/70"
                }`}
              />
            </g>

            {/* Target Crosshairs */}
            {selectedRegion === "chest" && (
              <circle cx="100" cy="115" r="14" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" className="animate-spin" />
            )}
            {selectedRegion === "head" && (
              <circle cx="100" cy="38" r="14" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="3,3" className="animate-spin" />
            )}
          </svg>

          {/* Quick Region Selector Pills */}
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {Object.keys(BODY_REGIONS).map((key) => {
              const r = BODY_REGIONS[key];
              const isSelected = selectedRegion === key;
              return (
                <button
                  key={key}
                  onClick={() => handleRegionClick(key)}
                  className={`text-[10px] px-2 py-0.5 rounded transition font-medium ${
                    isSelected
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {r.icon} {r.id.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Clinical Details & Action Panel */}
        <div className="md:col-span-7 flex flex-col gap-2.5">
          <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                <span>{region.icon}</span>
                <span>{region.nameEn}</span>
                <span className="text-slate-400 text-xs font-normal">({region.nameBn})</span>
              </div>
              <p className="text-[11px] text-slate-400">Click any symptom below to inject into clinical triage</p>
            </div>
          </div>

          {/* Red Flags Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> High Urgency Red Flags (ESI 1-2 / Severe)
            </span>
            <div className="space-y-1">
              {region.redFlags.map((rf, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    onSelectSymptom &&
                    onSelectSymptom({
                      textBn: rf.textBn,
                      textEn: rf.textEn,
                      isSevere: true,
                      regionId: region.id,
                      regionName: region.nameEn
                    })
                  }
                  className="w-full text-left p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-200 text-xs transition flex items-start justify-between gap-2 group"
                >
                  <div>
                    <p className="font-semibold text-red-100 group-hover:text-white">{rf.textBn}</p>
                    <p className="text-[11px] text-red-300/80 mt-0.5">{rf.textEn}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Common Symptoms Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Common Symptoms (ESI 3-5 / Moderate or Mild)
            </span>
            <div className="grid grid-cols-1 gap-1">
              {region.commonSymptoms.map((sym, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    onSelectSymptom &&
                    onSelectSymptom({
                      textBn: sym.textBn,
                      textEn: sym.textEn,
                      isSevere: false,
                      regionId: region.id,
                      regionName: region.nameEn
                    })
                  }
                  className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs transition flex items-start justify-between gap-2 group"
                >
                  <div>
                    <p className="font-medium text-slate-200 group-hover:text-indigo-200">{sym.textBn}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sym.textEn}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

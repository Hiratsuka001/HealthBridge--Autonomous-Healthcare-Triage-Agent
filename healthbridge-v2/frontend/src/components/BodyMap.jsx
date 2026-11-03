import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Activity, Crosshair } from "lucide-react";
import { BODY_REGIONS } from "../utils/bodyRegions";

export default function BodyMap({ onSelectSymptom, activeRegionId = "chest", lang = "bn" }) {
  const [selectedRegion, setSelectedRegion] = useState(activeRegionId);
  const region = BODY_REGIONS[selectedRegion] || BODY_REGIONS.chest;

  const handleRegionClick = (id) => {
    setSelectedRegion(id);
  };

  const isBn = lang === "bn";

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 rounded-xl text-teal-700 border border-teal-200/70">
            <Activity className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {isBn ? "শারীরিক লক্ষণ নির্দেশক মানচিত্র" : "Interactive Anatomical Body Map"}
              <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200/80 px-2 py-0.5 rounded-full font-semibold">
                {isBn ? "উপসর্গ নির্বাচন" : "Symptom Locator"}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? "শরীরের যে অংশে সমস্যা হচ্ছে সেখানে স্পর্শ করে জরুরি লক্ষণ দেখুন"
                : "Tap any anatomical zone to inspect clinical red flags"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Anatomical Silhouette Card */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 relative">
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-teal-600" />
            <span>{isBn ? "অঙ্গ নির্বাচন করুন" : "Select Region"}</span>
          </div>

          <svg
            viewBox="0 0 200 340"
            className="w-44 h-72 select-none filter drop-shadow-sm"
          >
            <defs>
              <linearGradient id="bodyBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Ambient Body Base Silhouette (Subtle background guide) */}
            <g opacity="0.4" pointerEvents="none">
              {/* Head */}
              <circle cx="100" cy="38" r="22" fill="#94a3b8" />
              {/* Neck */}
              <rect x="94" y="58" width="12" height="14" rx="4" fill="#94a3b8" />
              {/* Torso */}
              <path d="M 68 72 C 68 72 60 140 70 190 C 78 200 122 200 130 190 C 140 140 132 72 132 72 Z" fill="#94a3b8" />
              {/* Arms */}
              <path d="M 66 74 C 54 90 40 150 36 195 C 42 198 48 198 52 195 C 55 150 68 110 74 88 Z" fill="#94a3b8" />
              <path d="M 134 74 C 146 90 160 150 164 195 C 158 198 152 198 148 195 C 145 150 132 110 126 88 Z" fill="#94a3b8" />
              {/* Legs */}
              <path d="M 75 198 C 72 240 70 290 68 330 C 76 332 84 332 86 330 C 90 290 94 240 98 198 Z" fill="#94a3b8" />
              <path d="M 125 198 C 128 240 130 290 132 330 C 124 332 116 332 114 330 C 110 290 106 240 102 198 Z" fill="#94a3b8" />
            </g>

            {/* INTERACTIVE REGIONS */}

            {/* HEAD */}
            <g
              onClick={() => handleRegionClick("head")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <ellipse
                cx="100"
                cy="38"
                rx="24"
                ry="26"
                className={`transition-all duration-200 ${
                  selectedRegion === "head"
                    ? "fill-teal-600 stroke-teal-700 stroke-[2.5] filter drop-shadow-md"
                    : "fill-white/95 stroke-slate-300 hover:fill-teal-50 hover:stroke-teal-400 stroke-2"
                }`}
              />
              <text
                x="100"
                y="42"
                textAnchor="middle"
                className={`text-[9px] font-bold pointer-events-none transition-colors ${
                  selectedRegion === "head" ? "fill-white" : "fill-slate-700"
                }`}
              >
                {isBn ? "মাথা" : "HEAD"}
              </text>
            </g>

            {/* AIRWAY / THROAT */}
            <g
              onClick={() => handleRegionClick("airway")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <rect
                x="90"
                y="66"
                width="20"
                height="16"
                rx="4"
                className={`transition-all duration-200 ${
                  selectedRegion === "airway"
                    ? "fill-teal-600 stroke-teal-700 stroke-[2.5]"
                    : "fill-white/95 stroke-slate-300 hover:fill-teal-50 hover:stroke-teal-400 stroke-2"
                }`}
              />
              <text
                x="100"
                y="77"
                textAnchor="middle"
                className={`text-[8px] font-bold pointer-events-none ${
                  selectedRegion === "airway" ? "fill-white" : "fill-slate-700"
                }`}
              >
                {isBn ? "গলা" : "NECK"}
              </text>
            </g>

            {/* CHEST & HEART */}
            <g
              onClick={() => handleRegionClick("chest")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <path
                d="M 68 85 L 132 85 C 134 110 130 135 125 142 L 75 142 C 70 135 66 110 68 85 Z"
                className={`transition-all duration-200 ${
                  selectedRegion === "chest"
                    ? "fill-red-600 stroke-red-700 stroke-[2.5] filter drop-shadow-md"
                    : "fill-white/95 stroke-slate-300 hover:fill-red-50 hover:stroke-red-400 stroke-2"
                }`}
              />
              <text
                x="100"
                y="117"
                textAnchor="middle"
                className={`text-[10px] font-bold pointer-events-none ${
                  selectedRegion === "chest" ? "fill-white" : "fill-slate-800"
                }`}
              >
                {isBn ? "বুক / হার্ট" : "CHEST"}
              </text>
            </g>

            {/* ABDOMEN */}
            <g
              onClick={() => handleRegionClick("abdomen")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <path
                d="M 74 146 L 126 146 L 122 186 L 78 186 Z"
                className={`transition-all duration-200 ${
                  selectedRegion === "abdomen"
                    ? "fill-amber-500 stroke-amber-600 stroke-[2.5]"
                    : "fill-white/95 stroke-slate-300 hover:fill-amber-50 hover:stroke-amber-400 stroke-2"
                }`}
              />
              <text
                x="100"
                y="169"
                textAnchor="middle"
                className={`text-[9px] font-bold pointer-events-none ${
                  selectedRegion === "abdomen" ? "fill-white" : "fill-slate-800"
                }`}
              >
                {isBn ? "পেট" : "ABDOMEN"}
              </text>
            </g>

            {/* PELVIS */}
            <g
              onClick={() => handleRegionClick("pelvis")}
              className="cursor-pointer transition-all duration-200 group"
            >
              <path
                d="M 78 189 L 122 189 L 115 214 L 85 214 Z"
                className={`transition-all duration-200 ${
                  selectedRegion === "pelvis"
                    ? "fill-purple-600 stroke-purple-700 stroke-[2.5]"
                    : "fill-white/95 stroke-slate-300 hover:fill-purple-50 hover:stroke-purple-400 stroke-2"
                }`}
              />
              <text
                x="100"
                y="204"
                textAnchor="middle"
                className={`text-[8px] font-bold pointer-events-none ${
                  selectedRegion === "pelvis" ? "fill-white" : "fill-slate-800"
                }`}
              >
                {isBn ? "তলপেট" : "PELVIS"}
              </text>
            </g>

            {/* LIMBS (Arms + Legs) */}
            <g
              onClick={() => handleRegionClick("limbs")}
              className="cursor-pointer transition-all duration-200 group"
            >
              {/* Left Arm */}
              <path
                d="M 64 88 L 44 150 L 36 195 L 46 198 L 54 155 L 68 98 Z"
                className={`transition-all duration-200 ${
                  selectedRegion === "limbs"
                    ? "fill-sky-600 stroke-sky-700 stroke-[2.5]"
                    : "fill-white/95 stroke-slate-300 hover:fill-sky-50 hover:stroke-sky-400 stroke-2"
                }`}
              />
              {/* Right Arm */}
              <path
                d="M 136 88 L 156 150 L 164 195 L 154 198 L 146 155 L 132 98 Z"
                className={`transition-all duration-200 ${
                  selectedRegion === "limbs"
                    ? "fill-sky-600 stroke-sky-700 stroke-[2.5]"
                    : "fill-white/95 stroke-slate-300 hover:fill-sky-50 hover:stroke-sky-400 stroke-2"
                }`}
              />
              {/* Left Leg */}
              <path
                d="M 83 216 L 76 275 L 72 328 L 84 328 L 91 275 L 97 216 Z"
                className={`transition-all duration-200 ${
                  selectedRegion === "limbs"
                    ? "fill-sky-600 stroke-sky-700 stroke-[2.5]"
                    : "fill-white/95 stroke-slate-300 hover:fill-sky-50 hover:stroke-sky-400 stroke-2"
                }`}
              />
              {/* Right Leg */}
              <path
                d="M 117 216 L 124 275 L 128 328 L 116 328 L 109 275 L 103 216 Z"
                className={`transition-all duration-200 ${
                  selectedRegion === "limbs"
                    ? "fill-sky-600 stroke-sky-700 stroke-[2.5]"
                    : "fill-white/95 stroke-slate-300 hover:fill-sky-50 hover:stroke-sky-400 stroke-2"
                }`}
              />
            </g>
          </svg>

          {/* Quick Region Selector Pills */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {Object.keys(BODY_REGIONS).map((key) => {
              const r = BODY_REGIONS[key];
              const isSelected = selectedRegion === key;
              return (
                <button
                  key={key}
                  onClick={() => handleRegionClick(key)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${
                    isSelected
                      ? "bg-teal-700 text-white font-bold shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{isBn ? r.nameBn : r.nameEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Region Clinical Details & Action Panel */}
        <div className="md:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/90">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <span className="text-base">{region.icon}</span>
                <span>{isBn ? region.nameBn : region.nameEn}</span>
                <span className="text-slate-500 text-xs font-normal">
                  ({isBn ? region.nameEn : region.nameBn})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn
                  ? "যে কোনো উপসর্গে স্পর্শ করুন, স্বয়ংক্রিয় ট্রায়াজে যোগ হবে"
                  : "Tap any symptom below to add directly into clinical triage"}
              </p>
            </div>
          </div>

          {/* High Urgency Red Flags Section */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>{isBn ? "জরুরি লাল সতর্কতা (ESI 1-2 / Severe)" : "Emergency Red Flags (ESI 1-2 / Severe)"}</span>
            </span>
            <div className="space-y-1.5">
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
                      regionName: region.nameEn,
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl bg-red-50 hover:bg-red-100/90 border border-red-200 text-red-900 text-xs transition flex items-start justify-between gap-3 group shadow-xs"
                >
                  <div>
                    <p className="font-semibold text-red-900 leading-snug">
                      {isBn ? rf.textBn : rf.textEn}
                    </p>
                    <p className="text-[11px] text-red-700/80 mt-0.5">
                      {isBn ? rf.textEn : rf.textBn}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-600 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Common Symptoms Section */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{isBn ? "সাধারণ উপসর্গ (ESI 3-5 / Mild - Moderate)" : "Common Symptoms (ESI 3-5 / Mild - Moderate)"}</span>
            </span>
            <div className="grid grid-cols-1 gap-1.5">
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
                      regionName: region.nameEn,
                    })
                  }
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs transition flex items-start justify-between gap-3 group shadow-xs"
                >
                  <div>
                    <p className="font-medium text-slate-800 group-hover:text-teal-900 leading-snug">
                      {isBn ? sym.textBn : sym.textEn}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isBn ? sym.textEn : sym.textBn}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 group-hover:text-teal-700 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

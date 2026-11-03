import React, { useState } from "react";
import { scanMedicineImage } from "../api";
import {
  Pill,
  Upload,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  FileText,
  RotateCcw,
  Activity,
} from "lucide-react";

export default function MedicineScanner({
  clinicalContext = {},
  onAddMedication = null,
  lang = "bn",
}) {
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedDemoPreset, setSelectedDemoPreset] = useState(null);
  const [syncedToEr, setSyncedToEr] = useState(false);

  const isBn = lang === "bn";

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setSelectedDemoPreset(null);
    setLoading(true);
    setSyncedToEr(false);

    try {
      const res = await scanMedicineImage(file, clinicalContext);
      setScanResult(res);
    } catch (err) {
      console.error("Medicine scan error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDemo = async (preset) => {
    setSelectedDemoPreset(preset.key);
    setImagePreview(preset.image);
    setLoading(true);
    setSyncedToEr(false);

    const dummyBlob = new Blob([preset.key], { type: "text/plain" });
    const dummyFile = new File([dummyBlob], `${preset.key}.jpg`, { type: "image/jpeg" });

    try {
      const res = await scanMedicineImage(dummyFile, {
        ...clinicalContext,
        symptoms: preset.simulatedSymptoms || clinicalContext.symptoms,
      });
      const merged = { ...preset.result, ...(res.brand_name ? res : {}) };
      setScanResult(merged);
    } catch (err) {
      console.error("Demo scan error:", err);
      setScanResult(preset.result);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToER = () => {
    if (!scanResult) return;
    if (onAddMedication) {
      onAddMedication(scanResult);
    }
    setSyncedToEr(true);
  };

  const demoPresets = [
    {
      key: "ecosprin",
      label: isBn ? "ইকোস্প্রিন ৭৫ (অ্যাসপিরিন)" : "Ecosprin 75 (Aspirin)",
      sublabel: isBn ? "জ্বর/ডেঙ্গুর উপসর্গে মারাত্মক বিপরীত প্রতিক্রিয়া" : "Fever/Dengue Hemorrhage Warning",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
      simulatedSymptoms: "High fever 103F for 3 days with severe body ache and rash",
      result: {
        brand_name: "Ecosprin 75",
        generic_name: "Aspirin (Acetylsalicylic Acid)",
        strength: "75 mg",
        drug_class: "NSAID / Antiplatelet",
        manufacturer: "Square Pharmaceuticals Ltd.",
        indication: "Antiplatelet / Cardiovascular prophylaxis",
        is_contraindicated: true,
        contraindication_severity: "CRITICAL",
        clinical_alert_message:
          "CRITICAL DANGER: Aspirin/NSAID is strictly contraindicated in acute febrile illness with suspected Dengue or active bleeding due to high risk of fatal internal hemorrhage and irreversible platelet inhibition.",
        bengali_patient_instruction:
          "জরুরি সতর্কতা: ডেঙ্গু বা অজানা জ্বরের সময় ইকোস্প্রিন (অ্যাসপিরিন) খেলে শরীরের ভেতরে মারাত্মক রক্তক্ষরণ হতে পারে। এই ওষুধ খাওয়া অবিলম্বে বন্ধ রাখুন।",
        safe_alternative: "Paracetamol 500mg (Napa / Ace) only for fever management, avoiding all NSAIDs.",
        er_prearrival_action:
          "Alert Trauma Bay: Ingestion of Aspirin antiplatelet. Check platelet count and coagulation profile stat on arrival.",
        ocr_text_detected: "ECOSPRIN 75 • Aspirin USP 75mg • Square Pharmaceuticals Ltd.",
      },
    },
    {
      key: "napa",
      label: isBn ? "নাপা এক্সট্রা (প্যারাসিটামল)" : "Napa Extra (Paracetamol)",
      sublabel: isBn ? "জ্বরের জন্য নিরাপদ প্রাথমিক ওষুধ" : "Safe First-Line Antipyretic",
      image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&auto=format&fit=crop&q=80",
      simulatedSymptoms: "Fever and mild headache",
      result: {
        brand_name: "Napa Extra",
        generic_name: "Paracetamol + Caffeine",
        strength: "500 mg + 65 mg",
        drug_class: "Antipyretic / Analgesic",
        manufacturer: "Beximco Pharmaceuticals Ltd.",
        indication: "Fever, mild to moderate acute pain relief",
        is_contraindicated: false,
        contraindication_severity: "SAFE",
        clinical_alert_message:
          "SAFE FOR FEVER: Paracetamol is the first-line antipyretic recommended by WHO protocols for febrile illness and suspected Dengue. Maximum daily dose 4000mg.",
        bengali_patient_instruction:
          "এই ওষুধটি জ্বরের জন্য নিরাপদ। ডাক্তারের পরামর্শ অনুযায়ী প্রতি ৬-৮ ঘণ্টা পরপর ১টি করে ট্যাবলেট গ্রহণ করা যেতে পারে (দিনে সর্বোচ্চ ৪০০০ মিলিগ্রাম)।",
        safe_alternative: "Standard Paracetamol 500mg without caffeine if patient experiences tachycardia.",
        er_prearrival_action: "Supportive antipyretic noted. Continue monitoring vitals.",
        ocr_text_detected: "NAPA EXTRA • Paracetamol 500mg & Caffeine 65mg • Beximco Pharma",
      },
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 text-xs space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-50 rounded-xl text-purple-700 border border-purple-200/70">
            <Pill className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>{isBn ? "ওষুধ ও প্রেসক্রিপশন নিরাপত্তা পরীক্ষক" : "Medication Safety Scanner"}</span>
              <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                {isBn ? "ওষুধ নিরাপত্তা" : "Rx Safety"}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              {isBn
                ? "ওষুধের ছবি স্ক্যান করে রোগীর উপসর্গের সাথে ক্ষতিকর বিপরীত প্রতিক্রিয়া যাচাই করুন"
                : "Scans medicine strips and flags harmful contraindications against acute symptoms"}
            </p>
          </div>
        </div>

        {scanResult && (
          <button
            onClick={() => {
              setScanResult(null);
              setImagePreview(null);
              setSelectedDemoPreset(null);
            }}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-lg border border-slate-200 transition"
          >
            <RotateCcw className="w-3 h-3" /> {isBn ? "রিসেট" : "Reset"}
          </button>
        )}
      </div>

      {/* Demo Presets Bar */}
      <div>
        <span className="text-xs text-slate-600 font-semibold block mb-2">
          {isBn ? "১-ক্লিক নমুনা ওষুধ (বা নিচে আপনার ওষুধের ছবি আপলোড করুন):" : "1-Click Demo Medications (or upload photo below):"}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {demoPresets.map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleRunDemo(preset)}
              className={`p-3 rounded-xl border text-left transition flex items-center justify-between shadow-xs ${
                selectedDemoPreset === preset.key
                  ? "bg-purple-50 border-purple-400 text-purple-900"
                  : "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700"
              }`}
            >
              <div>
                <span className="font-bold block text-xs">{preset.label}</span>
                <span className="text-[11px] text-slate-500 mt-0.5">{preset.sublabel}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div>
        <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-purple-400 rounded-xl p-3.5 transition flex items-center justify-center gap-2 text-slate-700 shadow-xs">
          <Upload className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-xs">
            {isBn ? "ওষুধের পাতা / প্রেসক্রিপশনের ছবি আপলোড করুন" : "Upload Photo of Medicine Strip / Prescription"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 bg-purple-100 rounded-full animate-bounce">
            <Activity className="w-4 h-4 text-purple-700 animate-spin" />
          </div>
          <p className="text-purple-950 font-bold text-xs">
            {isBn ? "ওষুধের উপাদান ও কেমিক্যাল সংমিশ্রণ বিশ্লেষণ করা হচ্ছে..." : "Analyzing active pharmaceutical ingredients..."}
          </p>
          <p className="text-[11px] text-purple-700/80">
            {isBn
              ? "রোগীর রক্তচাপ, পালস ও লক্ষণের বিপরীতে বিপজ্জনক বিপরীত প্রতিক্রিয়া (Contraindication) যাচাই চলছে"
              : "Verifying molecule contraindications against current patient vitals and triage status"}
          </p>
        </div>
      )}

      {/* Results View */}
      {scanResult && !loading && (
        <div className="space-y-3 pt-1">
          {/* Main Contraindication Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col gap-2 shadow-xs ${
              scanResult.is_contraindicated
                ? "bg-red-50 border-red-300 text-red-950"
                : "bg-emerald-50 border-emerald-300 text-emerald-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                {scanResult.is_contraindicated ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 font-extrabold">
                      {isBn ? "⚠️ মারাত্মক বিপরীত প্রতিক্রিয়া শনাক্ত!" : "CRITICAL CONTRAINDICATION DETECTED"}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold">
                      {isBn ? "✅ ব্যবহারের জন্য নিরাপদ" : "MEDICATION COMPATIBLE & SAFE"}
                    </span>
                  </>
                )}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  scanResult.is_contraindicated ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                }`}
              >
                {scanResult.contraindication_severity || "REVIEW"}
              </span>
            </div>

            <p className="text-xs leading-relaxed font-medium">
              {scanResult.clinical_alert_message}
            </p>

            {scanResult.bengali_patient_instruction && (
              <div className="bg-white/80 p-2.5 rounded-lg border border-current/20 text-xs font-semibold">
                👉 {scanResult.bengali_patient_instruction}
              </div>
            )}
          </div>

          {/* Scanned Image Preview & OCR Note */}
          {imagePreview && (
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <img
                src={imagePreview}
                alt="Scanned prescription"
                className="w-14 h-14 object-cover rounded-lg border border-slate-300"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">
                  {isBn ? "স্ক্যানকৃত ওষুধের পাতা" : "Scanned Medication Strip"}
                </span>
                <span className="text-[11px] text-slate-500 line-clamp-1">
                  {scanResult.ocr_text_detected || (isBn ? "টেক্সট সনাক্তকরণ সফল" : "Optical recognition verified")}
                </span>
              </div>
            </div>
          )}

          {/* Molecule Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "ব্র্যান্ড" : "Brand"}</span>
              <span className="font-bold text-slate-900 text-xs">{scanResult.brand_name || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "জেনেরিক নাম" : "Generic"}</span>
              <span className="font-bold text-slate-900 text-xs">{scanResult.generic_name || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "মাত্রা / স্ট্রেন্থ" : "Strength"}</span>
              <span className="font-bold text-slate-900 text-xs">{scanResult.strength || "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">{isBn ? "প্রস্তুতকারক" : "Company"}</span>
              <span className="font-bold text-slate-900 text-xs truncate block">{scanResult.manufacturer || "N/A"}</span>
            </div>
          </div>

          {/* Safe Alternative Recommendation */}
          {scanResult.safe_alternative && (
            <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl text-blue-950 flex items-start gap-2 shadow-xs">
              <PlusCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs block">{isBn ? "নিরাপদ বিকল্প প্রস্তাবনা:" : "Safe Alternative:"}</span>
                <span className="text-xs">{scanResult.safe_alternative}</span>
              </div>
            </div>
          )}

          {/* Sync to ER Pre-Arrival Record Button */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              {isBn
                ? "হাসপাতাল ER ট্রমা ড্যাশবোর্ডে ওষুধের তথ্য পাঠাতে চান?"
                : "Sync scanned medication to inbound ER dossier?"}
            </span>
            <button
              onClick={handleSyncToER}
              disabled={syncedToEr}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                syncedToEr
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-purple-700 hover:bg-purple-800 text-white"
              }`}
            >
              {syncedToEr ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBn ? "হাসপাতালে যুক্ত হয়েছে" : "Logged to Inbound Bay"}</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isBn ? "হাসপাতাল ফাইলে যোগ করুন" : "Add to ER Dossier"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const BODY_REGIONS = {
  head: {
    id: "head",
    nameEn: "Head & Neurological",
    nameBn: "মাথা ও স্নায়ুতন্ত্র",
    icon: "🧠",
    redFlags: [
      { textBn: "হঠাৎ কথা জড়িয়ে যাওয়া বা মুখের একপাশ বেঁকে যাওয়া", textEn: "Sudden slurred speech or facial droop (Stroke FAST)", isSevere: true },
      { textBn: "জীবনের সবচেয়ে তীব্র আকস্মিক মাথাব্যথা", textEn: "Sudden thunderclap severe headache", isSevere: true },
      { textBn: "অজ্ঞান হওয়া বা সাময়িক স্মৃতিশক্তি হারানো", textEn: "Loss of consciousness or syncope", isSevere: true }
    ],
    commonSymptoms: [
      { textBn: "সকাল থেকে মাথা ঘুরছে ও চোখে অন্ধকার লাগছে", textEn: "Dizziness and lightheadedness since morning", isSevere: false },
      { textBn: "রোদ বা গরমে দীর্ঘক্ষণ থাকার পর দুর্বলতা", textEn: "Heat exhaustion / dehydration weakness", isSevere: false },
      { textBn: "সাধারণ ক্লান্তি ও মাথাব্যথা", textEn: "Mild tension headache and fatigue", isSevere: false }
    ]
  },
  airway: {
    id: "airway",
    nameEn: "Airway & Throat",
    nameBn: "গলা ও শ্বাসনালী",
    icon: "🫁",
    redFlags: [
      { textBn: "শ্বাস নিতে না পারা বা বাঁশির মতো শব্দ (Stridor)", textEn: "Stridor / severe upper airway obstruction", isSevere: true },
      { textBn: "মুখ ও জিহ্বা ফুলে যাওয়া (অ্যালার্জি জনিত অ্যানাফিল্যাক্সিস)", textEn: "Swelling of lips, tongue, or anaphylaxis", isSevere: true }
    ],
    commonSymptoms: [
      { textBn: "গলায় খুসখুসে কাশি ও সামান্য ব্যথা", textEn: "Sore throat and mild scratchy cough", isSevere: false },
      { textBn: "নাক বন্ধ ও হাঁচি", textEn: "Mild nasal congestion and sneezing", isSevere: false }
    ]
  },
  chest: {
    id: "chest",
    nameEn: "Chest & Heart",
    nameBn: "বুক ও হৃদযন্ত্র",
    icon: "❤️",
    redFlags: [
      { textBn: "বুকে প্রচণ্ড চাপ, যা বাম হাত বা চোয়ালে ছড়াচ্ছে", textEn: "Crushing retrosternal chest pressure radiating to jaw/arm", isSevere: true },
      { textBn: "প্রচণ্ড শ্বাসকষ্ট ও ঠান্ডা ঘাম বের হওয়া", textEn: "Acute dyspnea with cold diaphoresis / clammy skin", isSevere: true },
      { textBn: "একটানা কথা বলতে না পারা (Breathlessness at rest)", textEn: "Inability to complete sentences at rest", isSevere: true }
    ],
    commonSymptoms: [
      { textBn: "খাওয়ার পর বুক জ্বালাপোড়া ও টক ঢেঁকুর (এসিডিটি)", textEn: "Post-prandial heartburn / acid reflux", isSevere: false },
      { textBn: "বুকে হাত দিলে পেশীতে হালকা ব্যথা", textEn: "Chest wall musculoskeletal tenderness on touch", isSevere: false },
      { textBn: "অতিরিক্ত উদ্বেগে দ্রুত হৃদস্পন্দন", textEn: "Mild anxiety-induced palpitations", isSevere: false }
    ]
  },
  abdomen: {
    id: "abdomen",
    nameEn: "Abdomen & Digestive",
    nameBn: "পেট ও পরিপাকতন্ত্র",
    icon: "🩺",
    redFlags: [
      { textBn: "রক্তবমি বা আলকাতরার মতো কালো পায়খানা", textEn: "Hematemesis (vomiting blood) or melena (black stool)", isSevere: true },
      { textBn: "পেট তক্তার মতো শক্ত ও অসহ্য তীব্র ব্যথা", textEn: "Board-like rigid abdomen (Peritonitis sign)", isSevere: true },
      { textBn: "১২ ঘণ্টার বেশি কোনো পানি বা ওআরএস পেটে না থাকা", textEn: "Intractable vomiting with severe clinical dehydration", isSevere: true }
    ],
    commonSymptoms: [
      { textBn: "হালকা পেট ফাঁপা ও বদহজম", textEn: "Mild bloating and dyspepsia", isSevere: false },
      { textBn: "পাতলা পায়খানা কিন্তু প্রস্রাব স্বাভাবিক রয়েছে", textEn: "Mild diarrhea with preserved oral fluid intake", isSevere: false },
      { textBn: "খাওয়ার পর পেট মুচড়ানো", textEn: "Crampy abdominal discomfort after meal", isSevere: false }
    ]
  },
  pelvis: {
    id: "pelvis",
    nameEn: "Pelvis & Renal",
    nameBn: "তলপেট ও কিডনি",
    icon: "🩹",
    redFlags: [
      { textBn: "কোমরে প্রচণ্ড কাঁপুনির ব্যথা ও প্রস্রাব বন্ধ হওয়া", textEn: "Severe flank pain with high fever or anuria", isSevere: true },
      { textBn: "গর্ভকালীন তীব্র তলপেটে ব্যথা বা রক্তপাত", textEn: "Acute obstetric abdominal pain or bleeding in pregnancy", isSevere: true }
    ],
    commonSymptoms: [
      { textBn: "প্রস্রাবে হালকা জ্বালাপোড়া (সম্ভাব্য ইউটিআই)", textEn: "Mild dysuria (suspected lower UTI)", isSevere: false },
      { textBn: "দীর্ঘক্ষণ বসে থাকার পর কোমরে হালকা টান", textEn: "Postural lower back muscular strain", isSevere: false }
    ]
  },
  limbs: {
    id: "limbs",
    nameEn: "Limbs & Extremities",
    nameBn: "হাত-পা ও অস্থি",
    icon: "🦵",
    redFlags: [
      { textBn: "হাড় বের হয়ে যাওয়া উন্মুক্ত ফ্র্যাকচার (Compound fracture)", textEn: "Open / compound fracture with visible bone", isSevere: true },
      { textBn: "আঘাতপ্রাপ্ত হাত বা পা ফ্যাকাশে, বরফের মতো ঠান্ডা ও নাড়িহীন", textEn: "Cold, pale, pulseless extremity (Vascular compromise)", isSevere: true },
      { textBn: "হঠাৎ এক হাত বা পায়ের শক্তি পুরোপুরি চলে যাওয়া", textEn: "Sudden unilateral focal limb weakness", isSevere: true }
    ],
    commonSymptoms: [
      { textBn: "হাঁটার সময় গোড়ালিতে মোচড় খাওয়া ও ফোলা", textEn: "Ankle sprain with localized swelling, weight-bearing intact", isSevere: false },
      { textBn: "ভারী জিনিস তোলার পর পেশীর টান", textEn: "Mild muscle soreness after physical exertion", isSevere: false }
    ]
  },
  skin: {
    id: "skin",
    nameEn: "Skin, Burns & Trauma",
    nameBn: "চামড়া, পোড়া ও ক্ষত",
    icon: "🔥",
    redFlags: [
      { textBn: "অবিরাম ফিনকি দিয়ে রক্তপাত যা ৫ মিনিটেও থামছে না", textEn: "Active arterial spurting hemorrhage unresponsive to pressure", isSevere: true },
      { textBn: "মুখমণ্ডল, শ্বাসনালী বা শরীরের বড় অংশ জুড়ে পোড়া", textEn: "Facial / airway burn or extensive deep second/third degree burn", isSevere: true },
      { textBn: "জ্বরের সাথে চামড়ায় দ্রুত ছড়ানো বেগুনি দাগ (Petechiae)", textEn: "Purpuric/petechial non-blanching rash with high fever", isSevere: true }
    ],
    commonSymptoms: [
      { textBn: "রান্না করার সময় সামান্য ছ্যাঁকা লাগা লালচে ভাব", textEn: "Minor superficial 1st degree burn (< 2 inches, no blistering)", isSevere: false },
      { textBn: "ছোটখাটো আঁচড় বা কাটা যা থেকে রক্তপাত বন্ধ হয়েছে", textEn: "Superficial laceration with controlled hemostasis", isSevere: false },
      { textBn: "কীটপতঙ্গের কামড়ে সামান্য লালচে চুলকানি", textEn: "Localized insect bite erythema without systemic reaction", isSevere: false }
    ]
  }
};

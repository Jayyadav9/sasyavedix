export type Lang = "en" | "hi";

export type Rating = "low" | "ok" | "high";

export type SoilInput = {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_carbon: number | null;
};

export function rate(kind: keyof SoilInput, value: number | null): Rating {
  if (value === null || Number.isNaN(value)) return "ok";
  switch (kind) {
    case "ph":
      return value < 6 ? "low" : value > 7.8 ? "high" : "ok";
    case "nitrogen":
      return value < 280 ? "low" : value > 560 ? "high" : "ok";
    case "phosphorus":
      return value < 10 ? "low" : value > 25 ? "high" : "ok";
    case "potassium":
      return value < 110 ? "low" : value > 280 ? "high" : "ok";
    case "organic_carbon":
      return value < 0.5 ? "low" : value > 0.75 ? "high" : "ok";
    default:
      return "ok";
  }
}

export const NUTRIENT_LABELS: Record<string, { en: string; hi: string; unit: string }> = {
  ph: { en: "pH", hi: "पी.एच.", unit: "" },
  nitrogen: { en: "Nitrogen (N)", hi: "नाइट्रोजन (N)", unit: "kg/ha" },
  phosphorus: { en: "Phosphorus (P)", hi: "फॉस्फोरस (P)", unit: "kg/ha" },
  potassium: { en: "Potassium (K)", hi: "पोटाश (K)", unit: "kg/ha" },
  organic_carbon: { en: "Organic carbon", hi: "जैविक कार्बन", unit: "%" },
};

export function ratingLabel(r: Rating, lang: Lang) {
  if (r === "low") return lang === "hi" ? "कम" : "Low";
  if (r === "high") return lang === "hi" ? "अधिक" : "High";
  return lang === "hi" ? "ठीक" : "Good";
}

/** Practical, per-acre recommendations derived from the test values. */
export function recommendations(s: SoilInput, lang: Lang): string[] {
  const out: string[] = [];
  const hi = lang === "hi";

  const phR = rate("ph", s.ph);
  if (phR === "low")
    out.push(
      hi
        ? `मिट्टी अम्लीय है (pH ${s.ph}) — बुवाई से 3-4 हफ्ते पहले 200-400 किग्रा/एकड़ चूना (लाइम) मिलाएं।`
        : `Soil is acidic (pH ${s.ph}) — apply 200-400 kg/acre agricultural lime 3-4 weeks before sowing.`,
    );
  else if (phR === "high")
    out.push(
      hi
        ? `मिट्टी क्षारीय है (pH ${s.ph}) — 200 किग्रा/एकड़ जिप्सम डालें और हरी खाद (ढैंचा) उगाएं।`
        : `Soil is alkaline (pH ${s.ph}) — apply 200 kg/acre gypsum and grow a dhaincha green-manure crop.`,
    );
  else out.push(hi ? `pH ${s.ph} फसलों के लिए उपयुक्त है।` : `pH ${s.ph} is in the ideal range.`);

  const n = rate("nitrogen", s.nitrogen);
  out.push(
    n === "low"
      ? hi
        ? "नाइट्रोजन कम — 50-55 किग्रा/एकड़ यूरिया तीन बार में बांटकर दें, साथ में 2 टन गोबर खाद।"
        : "Nitrogen is low — apply 50-55 kg/acre urea in three splits plus 2 tonnes farmyard manure."
      : n === "high"
        ? hi
          ? "नाइट्रोजन अधिक — यूरिया 25% घटाएं, वरना फसल गिरेगी और कीट बढ़ेंगे।"
          : "Nitrogen is high — cut urea by 25%, otherwise the crop lodges and pests increase."
        : hi
          ? "नाइट्रोजन संतुलित — सामान्य अनुशंसित मात्रा ही दें।"
          : "Nitrogen is balanced — keep the standard recommended dose.",
  );

  const p = rate("phosphorus", s.phosphorus);
  out.push(
    p === "low"
      ? hi
        ? "फॉस्फोरस कम — बुवाई के समय 50 किग्रा/एकड़ DAP या 100 किग्रा SSP बेसल में दें।"
        : "Phosphorus is low — drill 50 kg/acre DAP or 100 kg SSP as a basal dose at sowing."
      : p === "high"
        ? hi
          ? "फॉस्फोरस पर्याप्त — इस मौसम DAP आधा करें, पैसा बचेगा।"
          : "Phosphorus is sufficient — halve DAP this season and save input cost."
        : hi
          ? "फॉस्फोरस ठीक — अनुशंसित बेसल मात्रा दें।"
          : "Phosphorus is adequate — use the standard basal dose.",
  );

  const k = rate("potassium", s.potassium);
  out.push(
    k === "low"
      ? hi
        ? "पोटाश कम — 35 किग्रा/एकड़ म्यूरेट ऑफ पोटाश (MOP) दें; दाना भरने में मदद मिलेगी।"
        : "Potassium is low — apply 35 kg/acre muriate of potash (MOP) to improve grain filling."
      : hi
        ? "पोटाश पर्याप्त — अतिरिक्त MOP की जरूरत नहीं।"
        : "Potassium is sufficient — no extra MOP needed.",
  );

  const oc = rate("organic_carbon", s.organic_carbon);
  if (oc === "low")
    out.push(
      hi
        ? "जैविक कार्बन कम — हर साल 2-3 टन/एकड़ कम्पोस्ट डालें और फसल अवशेष खेत में मिलाएं, जलाएं नहीं।"
        : "Organic carbon is low — add 2-3 tonnes/acre compost yearly and incorporate crop residue instead of burning it.",
    );

  return out;
}

const CROP_GUIDE: Record<string, { ph: [number, number]; en: string; hi: string }> = {
  Wheat: {
    ph: [6, 7.5],
    en: "Wheat: 48 kg N, 24 kg P, 16 kg K per acre. Split urea at sowing, first irrigation (21 days) and tillering.",
    hi: "गेहूं: प्रति एकड़ 48 किग्रा N, 24 किग्रा P, 16 किग्रा K। यूरिया बुवाई, पहली सिंचाई (21 दिन) और कल्ले फूटने पर बांटकर दें।",
  },
  Rice: {
    ph: [5.5, 7],
    en: "Rice: 40 kg N, 20 kg P, 20 kg K per acre plus 10 kg zinc sulphate; keep 5 cm standing water at tillering.",
    hi: "धान: प्रति एकड़ 40 किग्रा N, 20 किग्रा P, 20 किग्रा K और 10 किग्रा जिंक सल्फेट; कल्ले फूटते समय 5 सेमी पानी रखें।",
  },
  Maize: {
    ph: [5.8, 7.5],
    en: "Maize: 48 kg N, 24 kg P, 16 kg K per acre; top-dress nitrogen at knee-high stage.",
    hi: "मक्का: प्रति एकड़ 48 किग्रा N, 24 किग्रा P, 16 किग्रा K; घुटने तक ऊंचाई पर नाइट्रोजन टॉप-ड्रेस करें।",
  },
  Soybean: {
    ph: [6, 7.5],
    en: "Soybean: only 12 kg N (starter), 32 kg P, 16 kg K per acre; treat seed with rhizobium culture.",
    hi: "सोयाबीन: प्रति एकड़ केवल 12 किग्रा N, 32 किग्रा P, 16 किग्रा K; बीज को राइजोबियम कल्चर से उपचारित करें।",
  },
  Cotton: {
    ph: [6, 8],
    en: "Cotton: 60 kg N, 24 kg P, 24 kg K per acre in three splits; add 10 kg/acre magnesium sulphate on light soils.",
    hi: "कपास: प्रति एकड़ 60 किग्रा N, 24 किग्रा P, 24 किग्रा K तीन बार में; हल्की मिट्टी में 10 किग्रा मैग्नीशियम सल्फेट दें।",
  },
  Onion: {
    ph: [6, 7.5],
    en: "Onion: 44 kg N, 24 kg P, 32 kg K per acre plus 8 kg sulphur for pungency and storage life.",
    hi: "प्याज: प्रति एकड़ 44 किग्रा N, 24 किग्रा P, 32 किग्रा K और 8 किग्रा सल्फर—तीखापन व भंडारण बेहतर होगा।",
  },
  Tomato: {
    ph: [6, 7],
    en: "Tomato: 40 kg N, 32 kg P, 32 kg K per acre with 10 tonnes FYM; add calcium to avoid blossom-end rot.",
    hi: "टमाटर: प्रति एकड़ 40 किग्रा N, 32 किग्रा P, 32 किग्रा K और 10 टन गोबर खाद; कैल्शियम दें ताकि फल सड़न न हो।",
  },
  Gram: {
    ph: [6, 8],
    en: "Gram: 8 kg N, 20 kg P per acre, no potash if K is adequate; one irrigation at pod formation.",
    hi: "चना: प्रति एकड़ 8 किग्रा N, 20 किग्रा P; पोटाश पर्याप्त हो तो न दें; फली बनते समय एक सिंचाई।",
  },
  Mustard: {
    ph: [6, 7.5],
    en: "Mustard: 32 kg N, 16 kg P per acre plus 8 kg sulphur — sulphur raises oil content sharply.",
    hi: "सरसों: प्रति एकड़ 32 किग्रा N, 16 किग्रा P और 8 किग्रा सल्फर — सल्फर से तेल की मात्रा बढ़ती है।",
  },
  Sugarcane: {
    ph: [6.5, 7.5],
    en: "Sugarcane: 100 kg N, 32 kg P, 48 kg K per acre in three splits; trash mulching saves 20% irrigation.",
    hi: "गन्ना: प्रति एकड़ 100 किग्रा N, 32 किग्रा P, 48 किग्रा K तीन बार में; पत्ती मल्चिंग से 20% पानी बचता है।",
  },
};

export function cropGuidance(crop: string | null, s: SoilInput, lang: Lang): string[] {
  if (!crop || !CROP_GUIDE[crop]) return [];
  const g = CROP_GUIDE[crop]!;
  const out = [lang === "hi" ? g.hi : g.en];
  if (s.ph < g.ph[0] || s.ph > g.ph[1]) {
    out.push(
      lang === "hi"
        ? `${crop} के लिए आदर्श pH ${g.ph[0]}–${g.ph[1]} है, आपकी मिट्टी ${s.ph} पर है — सुधार के बाद ही बुवाई करें।`
        : `${crop} prefers pH ${g.ph[0]}–${g.ph[1]}; your soil is at ${s.ph} — correct it before sowing.`,
    );
  } else {
    out.push(
      lang === "hi"
        ? `आपकी मिट्टी का pH ${crop} के लिए उपयुक्त है।`
        : `Your soil pH suits ${crop} well.`,
    );
  }
  return out;
}

export const GUIDE_CROPS = Object.keys(CROP_GUIDE);

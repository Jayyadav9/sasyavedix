export type TaskKind = "irrigation" | "fertiliser" | "spray" | "weeding" | "harvest" | "general";

export type TaskTemplate = {
  kind: TaskKind;
  day: number; // days after sowing
  en: string;
  hi: string;
};

export type CropTemplate = {
  crop: string;
  durationDays: number;
  tasks: TaskTemplate[];
};

const base = (durationDays: number, extra: TaskTemplate[] = []): TaskTemplate[] => [
  { kind: "general", day: 0, en: "Sowing / transplanting", hi: "बुवाई / रोपाई" },
  { kind: "fertiliser", day: 1, en: "Basal fertiliser dose", hi: "बेसल खाद डालें" },
  { kind: "irrigation", day: 20, en: "First irrigation", hi: "पहली सिंचाई" },
  { kind: "weeding", day: 28, en: "Weeding / inter-culture", hi: "निराई-गुड़ाई" },
  ...extra,
  { kind: "general", day: durationDays - 7, en: "Check maturity and plan harvest", hi: "पकाव देखें, कटाई की योजना बनाएं" },
  { kind: "harvest", day: durationDays, en: "Harvest", hi: "कटाई" },
];

export const CROP_TEMPLATES: CropTemplate[] = [
  {
    crop: "Wheat",
    durationDays: 135,
    tasks: base(135, [
      { kind: "fertiliser", day: 30, en: "First top dressing of urea", hi: "पहली बार यूरिया छिड़कें" },
      { kind: "irrigation", day: 45, en: "Crown root irrigation", hi: "क्राउन रूट सिंचाई" },
      { kind: "spray", day: 60, en: "Check for rust, spray if needed", hi: "रतुआ की जांच, ज़रूरत पर छिड़काव" },
      { kind: "irrigation", day: 80, en: "Flowering stage irrigation", hi: "फूल अवस्था में सिंचाई" },
      { kind: "irrigation", day: 105, en: "Grain filling irrigation", hi: "दाना भरने पर सिंचाई" },
    ]),
  },
  {
    crop: "Rice",
    durationDays: 130,
    tasks: base(130, [
      { kind: "fertiliser", day: 25, en: "Top dress nitrogen at tillering", hi: "कल्ले फूटते समय नाइट्रोजन" },
      { kind: "spray", day: 45, en: "Scout for stem borer / blast", hi: "तना छेदक व ब्लास्ट की जांच" },
      { kind: "irrigation", day: 60, en: "Keep 5 cm standing water", hi: "5 सेमी पानी बनाए रखें" },
      { kind: "fertiliser", day: 70, en: "Panicle initiation dose", hi: "बाली बनने पर खाद" },
    ]),
  },
  {
    crop: "Maize",
    durationDays: 100,
    tasks: base(100, [
      { kind: "fertiliser", day: 25, en: "Knee-high urea dose", hi: "घुटने तक बढ़ने पर यूरिया" },
      { kind: "spray", day: 35, en: "Fall armyworm scouting", hi: "फॉल आर्मीवर्म की जांच" },
      { kind: "irrigation", day: 55, en: "Tasseling irrigation", hi: "फूल आने पर सिंचाई" },
    ]),
  },
  {
    crop: "Soybean",
    durationDays: 105,
    tasks: base(105, [
      { kind: "spray", day: 35, en: "Pest scouting — girdle beetle", hi: "कीट जांच — गर्डल बीटल" },
      { kind: "irrigation", day: 55, en: "Pod filling irrigation", hi: "फली भरने पर सिंचाई" },
    ]),
  },
  {
    crop: "Cotton",
    durationDays: 170,
    tasks: base(170, [
      { kind: "spray", day: 45, en: "Pink bollworm pheromone traps", hi: "गुलाबी सुंडी के फेरोमोन ट्रैप" },
      { kind: "fertiliser", day: 60, en: "Square formation dose", hi: "कली बनने पर खाद" },
      { kind: "irrigation", day: 90, en: "Boll development irrigation", hi: "गूलर बनने पर सिंचाई" },
    ]),
  },
  {
    crop: "Onion",
    durationDays: 120,
    tasks: base(120, [
      { kind: "fertiliser", day: 30, en: "Nitrogen + sulphur dose", hi: "नाइट्रोजन + सल्फर" },
      { kind: "spray", day: 50, en: "Thrips / purple blotch check", hi: "थ्रिप्स व बैंगनी धब्बा जांच" },
      { kind: "general", day: 105, en: "Stop irrigation before lifting", hi: "खुदाई से पहले सिंचाई बंद" },
    ]),
  },
  {
    crop: "Tomato",
    durationDays: 110,
    tasks: base(110, [
      { kind: "general", day: 25, en: "Staking and pruning", hi: "सहारा व कटाई-छंटाई" },
      { kind: "spray", day: 40, en: "Leaf curl virus / whitefly check", hi: "पत्ती मरोड़ व सफेद मक्खी जांच" },
      { kind: "harvest", day: 75, en: "First picking", hi: "पहली तुड़ाई" },
    ]),
  },
  {
    crop: "Gram",
    durationDays: 120,
    tasks: base(120, [
      { kind: "spray", day: 55, en: "Pod borer monitoring", hi: "फली छेदक की निगरानी" },
      { kind: "irrigation", day: 70, en: "Pod filling irrigation", hi: "फली भरने पर सिंचाई" },
    ]),
  },
  {
    crop: "Mustard",
    durationDays: 125,
    tasks: base(125, [
      { kind: "spray", day: 45, en: "Aphid check", hi: "माहू की जांच" },
      { kind: "irrigation", day: 65, en: "Siliqua formation irrigation", hi: "फली बनने पर सिंचाई" },
    ]),
  },
  {
    crop: "Sugarcane",
    durationDays: 330,
    tasks: base(330, [
      { kind: "fertiliser", day: 60, en: "Second nitrogen dose", hi: "दूसरी नाइट्रोजन खुराक" },
      { kind: "general", day: 120, en: "Earthing up", hi: "मिट्टी चढ़ाना" },
      { kind: "general", day: 180, en: "Tying / propping", hi: "बंधाई" },
    ]),
  },
];

export function templateFor(crop: string): CropTemplate {
  return (
    CROP_TEMPLATES.find((c) => c.crop.toLowerCase() === crop.toLowerCase()) ?? {
      crop,
      durationDays: 120,
      tasks: base(120),
    }
  );
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const TASK_KIND_LABEL: Record<TaskKind, { en: string; hi: string }> = {
  irrigation: { en: "Irrigation", hi: "सिंचाई" },
  fertiliser: { en: "Fertiliser", hi: "खाद" },
  spray: { en: "Spray", hi: "छिड़काव" },
  weeding: { en: "Weeding", hi: "निराई" },
  harvest: { en: "Harvest", hi: "कटाई" },
  general: { en: "Field work", hi: "खेत का काम" },
};

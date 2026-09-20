export type FarmLocation = {
  id: string;
  en: string;
  hi: string;
  state: string;
  lat: number;
  lon: number;
};

export const LOCATIONS: FarmLocation[] = [
  { id: "indore", en: "Indore", hi: "इंदौर", state: "Madhya Pradesh", lat: 22.72, lon: 75.86 },
  { id: "ujjain", en: "Ujjain", hi: "उज्जैन", state: "Madhya Pradesh", lat: 23.18, lon: 75.78 },
  { id: "karnal", en: "Karnal", hi: "करनाल", state: "Haryana", lat: 29.69, lon: 76.99 },
  { id: "hisar", en: "Hisar", hi: "हिसार", state: "Haryana", lat: 29.15, lon: 75.72 },
  { id: "ludhiana", en: "Ludhiana", hi: "लुधियाना", state: "Punjab", lat: 30.9, lon: 75.85 },
  { id: "nashik", en: "Nashik", hi: "नासिक", state: "Maharashtra", lat: 19.99, lon: 73.78 },
  { id: "nagpur", en: "Nagpur", hi: "नागपुर", state: "Maharashtra", lat: 21.15, lon: 79.09 },
  { id: "rajkot", en: "Rajkot", hi: "राजकोट", state: "Gujarat", lat: 22.3, lon: 70.8 },
  { id: "kolar", en: "Kolar", hi: "कोलार", state: "Karnataka", lat: 13.14, lon: 78.13 },
  { id: "davangere", en: "Davangere", hi: "दावणगेरे", state: "Karnataka", lat: 14.47, lon: 75.92 },
  { id: "raipur", en: "Raipur", hi: "रायपुर", state: "Chhattisgarh", lat: 21.25, lon: 81.63 },
  { id: "bikaner", en: "Bikaner", hi: "बीकानेर", state: "Rajasthan", lat: 28.02, lon: 73.31 },
  { id: "bharatpur", en: "Bharatpur", hi: "भरतपुर", state: "Rajasthan", lat: 27.22, lon: 77.49 },
  { id: "meerut", en: "Meerut", hi: "मेरठ", state: "Uttar Pradesh", lat: 28.98, lon: 77.71 },
  { id: "varanasi", en: "Varanasi", hi: "वाराणसी", state: "Uttar Pradesh", lat: 25.32, lon: 82.97 },
  { id: "patna", en: "Patna", hi: "पटना", state: "Bihar", lat: 25.59, lon: 85.14 },
  { id: "guntur", en: "Guntur", hi: "गुंटूर", state: "Andhra Pradesh", lat: 16.31, lon: 80.44 },
  { id: "coimbatore", en: "Coimbatore", hi: "कोयंबटूर", state: "Tamil Nadu", lat: 11.02, lon: 76.96 },
];

export function findLocation(id: string | null | undefined) {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0]!;
}

export const WEATHER_CODES: Record<number, { en: string; hi: string }> = {
  0: { en: "Clear sky", hi: "साफ आसमान" },
  1: { en: "Mostly clear", hi: "अधिकतर साफ" },
  2: { en: "Partly cloudy", hi: "आंशिक बादल" },
  3: { en: "Cloudy", hi: "बादल" },
  45: { en: "Fog", hi: "कोहरा" },
  48: { en: "Freezing fog", hi: "घना कोहरा" },
  51: { en: "Light drizzle", hi: "हल्की बूंदाबांदी" },
  53: { en: "Drizzle", hi: "बूंदाबांदी" },
  55: { en: "Heavy drizzle", hi: "तेज बूंदाबांदी" },
  61: { en: "Light rain", hi: "हल्की बारिश" },
  63: { en: "Rain", hi: "बारिश" },
  65: { en: "Heavy rain", hi: "भारी बारिश" },
  71: { en: "Light snow", hi: "हल्की बर्फ" },
  80: { en: "Rain showers", hi: "बौछारें" },
  81: { en: "Heavy showers", hi: "तेज बौछारें" },
  82: { en: "Violent showers", hi: "मूसलाधार बौछारें" },
  95: { en: "Thunderstorm", hi: "आंधी-तूफान" },
  96: { en: "Storm with hail", hi: "ओलावृष्टि" },
  99: { en: "Severe hailstorm", hi: "भीषण ओलावृष्टि" },
};

export function weatherLabel(code: number, lang: "en" | "hi") {
  return WEATHER_CODES[code]?.[lang] ?? (lang === "hi" ? "मिश्रित मौसम" : "Mixed weather");
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  appName: { en: "SasyaVediX", hi: "सस्यवेदिक्स" },
  tagline: { en: "Smart Farming for Smart India", hi: "स्मार्ट भारत के लिए स्मार्ट खेती" },
  aiPowered: { en: "AI Powered Smart Farming", hi: "एआई संचालित स्मार्ट खेती" },
  realtimeWeather: { en: "Real-time Weather", hi: "रीयल-टाइम मौसम" },
  liveMarket: { en: "Live Market Prices", hi: "लाइव मंडी भाव" },
  soilIntel: { en: "Soil Intelligence", hi: "मृदा जानकारी" },
  aiAssistant: { en: "AI Assistant", hi: "एआई सहायक" },
  farmerTagline: {
    en: "Built for the farmer, not the spreadsheet.",
    hi: "किसान के लिए बनाया गया, फाइलों के लिए नहीं।",
  },
  signIn: { en: "Sign in", hi: "लॉगिन करें" },
  signUp: { en: "Create account", hi: "खाता बनाएं" },
  email: { en: "Email", hi: "ईमेल" },
  password: { en: "Password", hi: "पासवर्ड" },
  fullName: { en: "Your name", hi: "आपका नाम" },
  continueGoogle: { en: "Continue with Google", hi: "Google से जारी रखें" },
  haveAccount: { en: "Already have an account? Sign in", hi: "पहले से खाता है? लॉगिन करें" },
  noAccount: { en: "New farmer? Create an account", hi: "नए किसान? खाता बनाएं" },
  logout: { en: "Logout", hi: "लॉगआउट" },

  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  weather: { en: "Weather", hi: "मौसम" },
  sellCrop: { en: "Sell Crop", hi: "फसल बेचें" },
  marketPrices: { en: "Market Prices", hi: "मंडी भाव" },
  cropAnalysis: { en: "Crop Analysis", hi: "फसल विश्लेषण" },
  cropVarieties: { en: "Crop Varieties", hi: "फसल किस्में" },
  soilHealth: { en: "Soil Health", hi: "मृदा स्वास्थ्य" },
  schemes: { en: "Government Schemes", hi: "सरकारी योजनाएं" },
  analytics: { en: "Analytics", hi: "विश्लेषण" },

  welcome: { en: "Welcome", hi: "स्वागत है" },
  welcomeSub: {
    en: "Your smart agricultural assistant is ready.",
    hi: "आपका स्मार्ट कृषि सहायक तैयार है।",
  },
  todayTemp: { en: "Today's Temperature", hi: "आज का तापमान" },
  bestPrice: { en: "Best Crop Price", hi: "सर्वोत्तम फसल भाव" },
  activeSchemes: { en: "Active Schemes", hi: "सक्रिय योजनाएं" },
  myListings: { en: "My Crop Listings", hi: "मेरी फसल सूची" },
  priceTrend: { en: "Price Trend (30 days)", hi: "मूल्य रुझान (30 दिन)" },
  topMandis: { en: "Top Mandi Prices Today", hi: "आज के शीर्ष मंडी भाव" },
  viewAll: { en: "View all", hi: "सभी देखें" },

  search: { en: "Search", hi: "खोजें" },
  crop: { en: "Crop", hi: "फसल" },
  variety: { en: "Variety", hi: "किस्म" },
  location: { en: "Location", hi: "स्थान" },
  mandi: { en: "Mandi", hi: "मंडी" },
  price: { en: "Price", hi: "भाव" },
  date: { en: "Date", hi: "दिनांक" },
  source: { en: "Source", hi: "स्रोत" },
  all: { en: "All", hi: "सभी" },
  highest: { en: "Highest", hi: "उच्चतम" },
  lowest: { en: "Lowest", hi: "न्यूनतम" },
  average: { en: "Average", hi: "औसत" },
  noResults: { en: "No records found", hi: "कोई रिकॉर्ड नहीं मिला" },
  loading: { en: "Loading…", hi: "लोड हो रहा है…" },

  quantity: { en: "Quantity", hi: "मात्रा" },
  expectedPrice: { en: "Expected price (₹/quintal)", hi: "अपेक्षित भाव (₹/क्विंटल)" },
  harvestDate: { en: "Harvest date", hi: "कटाई की तारीख" },
  quality: { en: "Quality grade", hi: "गुणवत्ता श्रेणी" },
  notes: { en: "Notes", hi: "टिप्पणी" },
  submitListing: { en: "List crop for sale", hi: "फसल बिक्री हेतु सूचीबद्ध करें" },
  listingCreated: { en: "Crop listed successfully", hi: "फसल सफलतापूर्वक सूचीबद्ध" },
  duration: { en: "Duration", hi: "अवधि" },
  yield: { en: "Yield", hi: "उपज" },
  season: { en: "Season", hi: "मौसम" },
  water: { en: "Water need", hi: "जल आवश्यकता" },
  days: { en: "days", hi: "दिन" },
  comingSoon: { en: "Coming in the next phase", hi: "अगले चरण में आ रहा है" },
} as const;

export type TKey = keyof typeof dict;

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: TKey) => string }>({
  lang: "en",
  setLang: () => {},
  t: (k) => dict[k].en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("sasyavedix-lang");
    if (stored === "hi" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("sasyavedix-lang", l);
  }, []);

  const t = useCallback((k: TKey) => dict[k][lang] ?? dict[k].en, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

// Official Government of India sources for mandi prices, MSP and advisories.
export type OfficialSource = {
  name_en: string;
  name_hi: string;
  desc_en: string;
  desc_hi: string;
  url: string;
};

export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    name_en: "Agmarknet",
    name_hi: "एगमार्कनेट",
    desc_en: "Daily mandi arrivals & prices from 3,000+ markets (Directorate of Marketing & Inspection).",
    desc_hi: "3,000+ मंडियों के रोज़ाना भाव और आवक (कृषि विपणन निदेशालय)।",
    url: "https://agmarknet.gov.in",
  },
  {
    name_en: "e-NAM",
    name_hi: "ई-नाम",
    desc_en: "National Agriculture Market — online trading platform with live mandi rates.",
    desc_hi: "राष्ट्रीय कृषि बाज़ार — लाइव मंडी भाव के साथ ऑनलाइन ट्रेडिंग मंच।",
    url: "https://www.enam.gov.in",
  },
  {
    name_en: "MSP — Farmers' Portal",
    name_hi: "MSP — किसान पोर्टल",
    desc_en: "Official minimum support price statements, season-wise, from the Ministry of Agriculture.",
    desc_hi: "कृषि मंत्रालय के आधिकारिक न्यूनतम समर्थन मूल्य विवरण, सीज़न-वार।",
    url: "https://farmer.gov.in/mspstatements.aspx",
  },
  {
    name_en: "data.gov.in Mandi API",
    name_hi: "data.gov.in मंडी API",
    desc_en: "Open government dataset of current mandi prices used by this app's live feed.",
    desc_hi: "वर्तमान मंडी भाव का खुला सरकारी डेटासेट, जिसे इस ऐप की लाइव फ़ीड उपयोग करती है।",
    url: "https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi",
  },
  {
    name_en: "Press Information Bureau",
    name_hi: "प्रेस सूचना ब्यूरो",
    desc_en: "Cabinet announcements on MSP and farm policy.",
    desc_hi: "MSP और कृषि नीति पर मंत्रिमंडल की घोषणाएं।",
    url: "https://www.pib.gov.in",
  },
];

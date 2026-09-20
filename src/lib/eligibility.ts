import type { Tables } from "@/integrations/supabase/types";

export type Scheme = Tables<"schemes">;

export type ProfileLike = {
  land_acres?: number | null;
  district?: string | null;
  state?: string | null;
} | null | undefined;

export type EligibilityCheck = {
  likely: boolean | null; // null = cannot tell from profile
  note_en: string;
  note_hi: string;
};

/** Simple rule-based eligibility hint per scheme, from the farmer's profile. */
export function checkEligibility(scheme: Scheme, profile: ProfileLike): EligibilityCheck {
  const name = scheme.name_en.toLowerCase();
  const land = profile?.land_acres != null ? Number(profile.land_acres) : null;

  if (land == null) {
    return {
      likely: null,
      note_en: "Add your land size in My Profile for a personalised check.",
      note_hi: "व्यक्तिगत जांच के लिए मेरी प्रोफ़ाइल में अपनी भूमि का आकार जोड़ें।",
    };
  }

  if (name.includes("pm-kisan")) {
    return land > 0
      ? { likely: true, note_en: "You own farmland — likely eligible.", note_hi: "आपके पास खेती की ज़मीन है — पात्र होने की संभावना।" }
      : { likely: false, note_en: "PM-KISAN needs land in your name.", note_hi: "PM-KISAN के लिए आपके नाम पर ज़मीन होनी चाहिए।" };
  }
  if (name.includes("fasal") || name.includes("pmfby") || scheme.category === "insurance") {
    return { likely: true, note_en: "All farmers growing notified crops can enrol.", note_hi: "अधिसूचित फसल उगाने वाले सभी किसान पात्र हैं।" };
  }
  if (name.includes("soil health")) {
    return { likely: true, note_en: "Every farm holding is eligible for a free soil test.", note_hi: "हर खेत मुफ़्त मिट्टी परीक्षण के लिए पात्र है।" };
  }
  if (name.includes("kisan credit") || name.includes("kcc")) {
    return land > 0
      ? { likely: true, note_en: "Landowners, tenants and sharecroppers can get a KCC.", note_hi: "भूमिधारक, काश्तकार और बटाईदार KCC ले सकते हैं।" }
      : { likely: true, note_en: "Even tenant farmers can apply for a KCC.", note_hi: "काश्तकार किसान भी KCC के लिए आवेदन कर सकते हैं।" };
  }
  if (name.includes("sinchayee") || name.includes("irrigation")) {
    return land >= 1
      ? { likely: true, note_en: "Your holding size fits most micro-irrigation subsidies.", note_hi: "आपकी जोत सूक्ष्म-सिंचाई सब्सिडी के लिए उपयुक्त है।" }
      : { likely: true, note_en: "Small holders get higher subsidy (55%+).", note_hi: "छोटे किसानों को अधिक सब्सिडी (55%+) मिलती है।" };
  }
  return { likely: true, note_en: "Open to all farmers — check details on the official site.", note_hi: "सभी किसानों के लिए खुला — आधिकारिक साइट पर विवरण देखें।" };
}

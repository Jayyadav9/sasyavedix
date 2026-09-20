import type { MarketPrice, MspRate } from "@/lib/queries";

export type SellSignal = "sell" | "wait" | "hold";

export type SellAdvice = {
  signal: SellSignal;
  latest: number;
  market: string;
  trendPct: number; // % change over the window
  msp: number | null;
  aboveMsp: boolean | null;
  reasons_en: string[];
  reasons_hi: string[];
};

/**
 * Rule-based sell-or-wait advice for one crop from its price history.
 * Looks at the best current mandi price, the 30-day trend, and the MSP floor.
 */
export function sellAdvice(
  crop: string,
  history: MarketPrice[],
  mspRows: MspRate[],
): SellAdvice | null {
  const rows = history
    .filter((r) => r.crop.toLowerCase() === crop.toLowerCase())
    .sort((a, b) => a.observed_on.localeCompare(b.observed_on));
  if (!rows.length) return null;

  // Best price on the most recent day
  const lastDay = rows[rows.length - 1]!.observed_on;
  const todayRows = rows.filter((r) => r.observed_on === lastDay);
  const best = todayRows.reduce((m, r) => (r.price > m.price ? r : m));

  // Trend: average of the most recent 7 days vs the 7 days a month earlier
  const dayMs = 86_400_000;
  const end = new Date(lastDay + "T00:00:00Z").getTime();
  const avgIn = (fromDays: number, toDays: number) => {
    const vals = rows
      .filter((r) => {
        const t = new Date(r.observed_on + "T00:00:00Z").getTime();
        const age = (end - t) / dayMs;
        return age >= fromDays && age < toDays;
      })
      .map((r) => Number(r.price));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const recentAvg = avgIn(0, 7) ?? Number(best.price);
  const pastAvg = avgIn(23, 37);
  const trendPct = pastAvg ? Math.round(((recentAvg - pastAvg) / pastAvg) * 1000) / 10 : 0;

  const mspRow = mspRows.find((m) => m.crop.toLowerCase() === crop.toLowerCase()) ?? null;
  const msp = mspRow ? Number(mspRow.msp) : null;
  const aboveMsp = msp == null ? null : Number(best.price) >= msp;

  const reasons_en: string[] = [];
  const reasons_hi: string[] = [];

  if (trendPct >= 3) {
    reasons_en.push(`Prices are up ${trendPct}% over the past month and still rising.`);
    reasons_hi.push(`भाव पिछले महीने ${trendPct}% बढ़े हैं और अभी भी बढ़ रहे हैं।`);
  } else if (trendPct <= -3) {
    reasons_en.push(`Prices are down ${Math.abs(trendPct)}% over the past month.`);
    reasons_hi.push(`भाव पिछले महीने ${Math.abs(trendPct)}% गिरे हैं।`);
  } else {
    reasons_en.push("Prices have been mostly steady this month.");
    reasons_hi.push("इस महीने भाव लगभग स्थिर रहे हैं।");
  }

  if (aboveMsp === true) {
    reasons_en.push(`Best mandi rate ₹${best.price} is above the MSP of ₹${msp}.`);
    reasons_hi.push(`सबसे अच्छा मंडी भाव ₹${best.price}, MSP ₹${msp} से ऊपर है।`);
  } else if (aboveMsp === false) {
    reasons_en.push(
      `Best mandi rate ₹${best.price} is below the MSP of ₹${msp} — consider selling through MSP procurement if available.`,
    );
    reasons_hi.push(
      `सबसे अच्छा मंडी भाव ₹${best.price}, MSP ₹${msp} से नीचे है — उपलब्ध हो तो MSP खरीद केंद्र पर बेचें।`,
    );
  }

  let signal: SellSignal;
  if (aboveMsp === false) {
    signal = "wait"; // below MSP: don't rush to private mandis
  } else if (trendPct >= 3) {
    signal = "wait"; // rising market: hold for better rates
  } else if (trendPct <= -3) {
    signal = "sell"; // falling market: sell before it drops more
  } else {
    signal = "hold"; // steady: sell when you need, no urgency either way
  }

  return {
    signal,
    latest: Number(best.price),
    market: best.market,
    trendPct,
    msp,
    aboveMsp,
    reasons_en,
    reasons_hi,
  };
}

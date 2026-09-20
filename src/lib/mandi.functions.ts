import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LOCATIONS } from "@/lib/locations";

const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";

type GovRecord = {
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  arrival_date?: string;
  modal_price?: string;
  min_price?: string;
  max_price?: string;
};

// The feed reports arrival dates as DD/MM/YYYY.
function toIsoDate(value: string | undefined): string {
  const parts = (value ?? "").split("/");
  if (parts.length !== 3) return new Date().toISOString().slice(0, 10);
  const [d, m, y] = parts;
  return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
}

const DISTRICTS = new Map(LOCATIONS.map((l) => [l.en.toLowerCase(), l]));

export const syncMandiPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const key = process.env["DATA_GOV_IN_API_KEY"];
    if (!key) {
      return { configured: false, inserted: 0, message: "Live mandi feed is not configured yet." };
    }

    const url = new URL(`https://api.data.gov.in/resource/${RESOURCE}`);
    url.searchParams.set("api-key", key);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5000");

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Mandi feed returned ${res.status}`);
    }
    const body = (await res.json()) as { records?: GovRecord[] };
    const records = body.records ?? [];

    const rows = records
      .filter((r) => DISTRICTS.has((r.district ?? "").trim().toLowerCase()))
      .map((r) => {
        const loc = DISTRICTS.get((r.district ?? "").trim().toLowerCase())!;
        const price = Number(r.modal_price ?? r.max_price ?? r.min_price ?? 0);
        return {
          crop: (r.commodity ?? "").trim(),
          variety: r.variety?.trim() || null,
          location: loc.en,
          market: (r.market ?? loc.en).trim(),
          price,
          unit: "₹/quintal",
          observed_on: toIsoDate(r.arrival_date),
          source: "data.gov.in",
        };
      })
      .filter((r) => r.crop !== "" && r.price > 0);

    if (rows.length === 0) {
      return { configured: true, inserted: 0, message: "No fresh rates for your districts today." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("market_prices")
      .upsert(rows, { onConflict: "crop,variety,market,location,observed_on,source" });
    if (error) throw new Error(error.message);

    return { configured: true, inserted: rows.length, message: "" };
  });

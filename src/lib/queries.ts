import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MarketPrice = {
  id: string;
  crop: string;
  variety: string | null;
  location: string;
  market: string;
  price: number;
  unit: string;
  observed_on: string;
  source: string;
};

export const marketPricesQuery = queryOptions({
  queryKey: ["market_prices"],
  queryFn: async (): Promise<MarketPrice[]> => {
    const { data, error } = await supabase
      .from("market_prices")
      .select("id, crop, variety, location, market, price, unit, observed_on, source")
      .order("observed_on", { ascending: false })
      .limit(1200);
    if (error) throw error;
    return (data ?? []) as MarketPrice[];
  },
});

export const varietiesQuery = queryOptions({
  queryKey: ["crop_varieties"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("crop_varieties")
      .select("*")
      .order("crop", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const schemesQuery = queryOptions({
  queryKey: ["schemes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("schemes")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const myListingsQuery = queryOptions({
  queryKey: ["crop_listings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("crop_listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

/** Latest price observation per crop+mandi combination. */
export function latestByCropMandi(rows: MarketPrice[]) {
  const seen = new Map<string, MarketPrice>();
  for (const row of rows) {
    const key = `${row.crop}|${row.market}|${row.variety ?? ""}`;
    const prev = seen.get(key);
    if (!prev || row.observed_on > prev.observed_on) seen.set(key, row);
  }
  return [...seen.values()];
}

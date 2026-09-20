import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cacheRead, cacheSave } from "@/lib/offline";

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
    try {
      const { data, error } = await supabase
        .from("market_prices")
        .select("id, crop, variety, location, market, price, unit, observed_on, source")
        .order("observed_on", { ascending: false })
        .limit(1200);
      if (error) throw error;
      const rows = (data ?? []) as MarketPrice[];
      cacheSave("market_prices", rows);
      return rows;
    } catch (err) {
      const hit = cacheRead<MarketPrice[]>("market_prices");
      if (hit) return hit.value;
      throw err;
    }
  },
});

export type Variety = {
  id: string;
  crop: string;
  name_en: string;
  name_hi: string;
  duration_days: number | null;
  yield_quintal_per_acre: number | null;
  season: string | null;
  water_need: string | null;
  notes_en: string | null;
  notes_hi: string | null;
};

export const varietiesQuery = queryOptions({
  queryKey: ["crop_varieties"],
  queryFn: async (): Promise<Variety[]> => {
    try {
      const { data, error } = await supabase
        .from("crop_varieties")
        .select("*")
        .order("crop", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Variety[];
      cacheSave("crop_varieties", rows);
      return rows;
    } catch (err) {
      const hit = cacheRead<Variety[]>("crop_varieties");
      if (hit) return hit.value;
      throw err;
    }
  },
});


export const schemesQuery = queryOptions({
  queryKey: ["schemes"],
  queryFn: async () => {
    try {
      const { data, error } = await supabase
        .from("schemes")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      cacheSave("schemes", data ?? []);
      return data ?? [];
    } catch (err) {
      const hit = cacheRead<never[]>("schemes");
      if (hit) return hit.value;
      throw err;
    }
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

export type CropAnalysisRow = {
  id: string;
  crop: string;
  image_url: string | null;
  health_score: number | null;
  status: string | null;
  diagnosis: string | null;
  recommendations: unknown;
  created_at: string;
};

export const analysesQuery = queryOptions({
  queryKey: ["crop_analysis"],
  queryFn: async (): Promise<CropAnalysisRow[]> => {
    const { data, error } = await supabase
      .from("crop_analysis")
      .select("id, crop, image_url, health_score, status, diagnosis, recommendations, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []) as CropAnalysisRow[];
  },
});

export type SoilTest = {
  id: string;
  sample_date: string;
  location: string | null;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_carbon: number | null;
  ec: number | null;
  target_crop: string | null;
  notes: string | null;
  created_at: string;
};

export const soilTestsQuery = queryOptions({
  queryKey: ["soil_tests"],
  queryFn: async (): Promise<SoilTest[]> => {
    const { data, error } = await supabase
      .from("soil_tests")
      .select("*")
      .order("sample_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SoilTest[];
  },
});

// ---------------- roles, offers, orders ----------------

export type Role = "farmer" | "buyer" | "admin";

export const roleQuery = queryOptions({
  queryKey: ["user_role"],
  queryFn: async (): Promise<Role> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return "farmer";
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);
    if (error) throw error;
    const roles = (data ?? []).map((r) => r.role as Role);
    return roles.includes("buyer") ? "buyer" : "farmer";
  },
  staleTime: 5 * 60 * 1000,
});

export type Offer = {
  id: string;
  listing_id: string;
  buyer_id: string;
  farmer_id: string;
  price_per_quintal: number;
  quantity: number;
  message: string | null;
  status: string;
  created_at: string;
};

export const offersQuery = queryOptions({
  queryKey: ["offers"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("offers")
      .select("*, crop_listings(crop, variety, location, quantity, expected_price, image_url)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export type Order = {
  id: string;
  crop: string;
  variety: string | null;
  quantity: number;
  price_per_quintal: number;
  total_amount: number;
  status: string;
  farmer_id: string;
  buyer_id: string;
  pickup_location: string | null;
  delivery_date: string | null;
  payment_method: string | null;
  payment_ref: string | null;
  invoice_no?: string | null;
  created_at: string;
  updated_at: string;
};

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Order[];
  },
});

/** Open listings from every farmer — visible to buyers via RLS. */
export const browseListingsQuery = queryOptions({
  queryKey: ["browse_listings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("crop_listings")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const ORDER_FLOW = ["accepted", "dispatched", "delivered", "paid"] as const;
export type OrderStatus = (typeof ORDER_FLOW)[number];

export const ORDER_LABELS: Record<string, { en: string; hi: string }> = {
  accepted: { en: "Offer accepted", hi: "प्रस्ताव स्वीकृत" },
  dispatched: { en: "Dispatched", hi: "भेजा गया" },
  delivered: { en: "Delivered", hi: "पहुँच गया" },
  paid: { en: "Payment received", hi: "भुगतान प्राप्त" },
  cancelled: { en: "Cancelled", hi: "रद्द" },
};

// ---------------- notifications, alerts, calendar, payments ----------------

export type Notification = {
  id: string;
  kind: string;
  title_en: string;
  title_hi: string;
  body_en: string | null;
  body_hi: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []) as Notification[];
  },
  refetchInterval: 60_000,
});

export type PriceAlert = {
  id: string;
  crop: string;
  market: string | null;
  direction: string;
  target_price: number;
  active: boolean;
  created_at: string;
};

export const priceAlertsQuery = queryOptions({
  queryKey: ["price_alerts"],
  queryFn: async (): Promise<PriceAlert[]> => {
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PriceAlert[];
  },
});

export type CropPlan = {
  id: string;
  crop: string;
  variety: string | null;
  sowing_date: string;
  harvest_date: string | null;
  area_acres: number | null;
  notes: string | null;
  status: string;
  created_at: string;
};

export const cropPlansQuery = queryOptions({
  queryKey: ["crop_plans"],
  queryFn: async (): Promise<CropPlan[]> => {
    const { data, error } = await supabase
      .from("crop_plans")
      .select("*")
      .order("sowing_date", { ascending: false });
    if (error) throw error;
    return (data ?? []) as CropPlan[];
  },
});

export type CropTask = {
  id: string;
  plan_id: string;
  kind: string;
  title_en: string;
  title_hi: string;
  due_date: string;
  done: boolean;
  done_on: string | null;
};

export const cropTasksQuery = queryOptions({
  queryKey: ["crop_tasks"],
  queryFn: async (): Promise<CropTask[]> => {
    const { data, error } = await supabase
      .from("crop_tasks")
      .select("id, plan_id, kind, title_en, title_hi, due_date, done, done_on")
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as CropTask[];
  },
});

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  reference: string | null;
  paid_on: string;
  note: string | null;
};

export const paymentsQuery = queryOptions({
  queryKey: ["payments"],
  queryFn: async (): Promise<Payment[]> => {
    const { data, error } = await supabase
      .from("payments")
      .select("id, order_id, amount, method, reference, paid_on, note")
      .order("paid_on", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Payment[];
  },
});

export type MspRate = {
  id: string;
  crop: string;
  season: string;
  msp: number;
  year: string;
};

export const mspQuery = queryOptions({
  queryKey: ["msp_rates"],
  queryFn: async (): Promise<MspRate[]> => {
    try {
      const { data, error } = await supabase.from("msp_rates").select("*");
      if (error) throw error;
      cacheSave("msp_rates", data ?? []);
      return (data ?? []) as MspRate[];
    } catch {
      return cacheRead<MspRate[]>("msp_rates") ?? [];
    }
  },
});

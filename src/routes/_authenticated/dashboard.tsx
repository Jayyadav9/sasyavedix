import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Thermometer, TrendingUp, Sprout, Landmark, ArrowRight } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useLang } from "@/lib/i18n";
import { LOCATIONS, findLocation } from "@/lib/locations";
import {
  latestByCropMandi,
  marketPricesQuery,
  myListingsQuery,
  profileQuery,
  schemesQuery,
} from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SasyaVediX" },
      { name: "description", content: "Your farm at a glance: weather, best prices and schemes." },
      { property: "og:title", content: "Farmer Dashboard — SasyaVediX" },
      { property: "og:description", content: "Weather, mandi prices and schemes in one place." },
    ],
  }),
  component: Dashboard,
});

function useWeather(loc: (typeof LOCATIONS)[number]) {
  return useQuery({
    queryKey: ["weather", loc.id],
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
          "&current=temperature_2m,relative_humidity_2m,precipitation&timezone=auto",
      );
      if (!res.ok) throw new Error("weather unavailable");
      return (await res.json()) as {
        current: { temperature_2m: number; relative_humidity_2m: number; precipitation: number };
      };
    },
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  tone = "field",
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
  tone?: "field" | "harvest";
}) {
  return (
    <div className="glass-card lift-hover rounded-3xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-24" />
          ) : (
            <p className="mt-1 font-display text-3xl font-bold">{value}</p>
          )}
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={`grid h-11 w-11 place-items-center rounded-2xl ${
            tone === "harvest" ? "gradient-harvest" : "gradient-field"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${tone === "harvest" ? "text-accent-foreground" : "text-primary-foreground"}`}
          />
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { t, lang } = useLang();
  const profile = useQuery(profileQuery);
  const prices = useQuery(marketPricesQuery);
  const schemes = useQuery(schemesQuery);
  const listings = useQuery(myListingsQuery);
  const weather = useWeather();

  const latest = prices.data ? latestByCropMandi(prices.data) : [];
  const best = [...latest].sort((a, b) => b.price - a.price)[0];
  const topToday = [...latest].sort((a, b) => b.price - a.price).slice(0, 6);

  const trendCrop = best?.crop ?? "Wheat";
  const trend = (prices.data ?? [])
    .filter((r) => r.crop === trendCrop)
    .sort((a, b) => a.observed_on.localeCompare(b.observed_on))
    .slice(-30)
    .map((r) => ({ date: r.observed_on.slice(5), price: Number(r.price) }));

  const name = profile.data?.full_name ?? "Farmer";
  const now = new Date();

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="rounded-3xl gradient-field px-6 py-7 text-primary-foreground shadow-[var(--shadow-field)]">
        <p className="text-sm opacity-85">
          {now.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
          {t("welcome")}, {name} 👨‍🌾
        </h1>
        <p className="mt-1 opacity-90">{t("welcomeSub")}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Thermometer}
          label={t("todayTemp")}
          loading={weather.isLoading}
          value={weather.data ? `${Math.round(weather.data.current.temperature_2m)}°C` : "—"}
          hint={
            weather.data ? `Humidity ${weather.data.current.relative_humidity_2m}% · Indore` : ""
          }
        />
        <StatCard
          icon={TrendingUp}
          tone="harvest"
          label={t("bestPrice")}
          loading={prices.isLoading}
          value={best ? `₹${Number(best.price).toLocaleString("en-IN")}` : "—"}
          hint={best ? `${best.crop} · ${best.market}` : ""}
        />
        <StatCard
          icon={Sprout}
          label={t("myListings")}
          loading={listings.isLoading}
          value={`${listings.data?.length ?? 0}`}
          hint={t("sellCrop")}
        />
        <StatCard
          icon={Landmark}
          tone="harvest"
          label={t("activeSchemes")}
          loading={schemes.isLoading}
          value={`${schemes.data?.length ?? 0}`}
          hint={t("schemes")}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="glass-card rounded-3xl p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">
              {t("priceTrend")} · {trendCrop}
            </h2>
          </div>
          {prices.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" width={55} />
                  <RTooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      background: "var(--color-card)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    fill="url(#priceFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card rounded-3xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{t("topMandis")}</h2>
            <Link to="/market" className="flex items-center gap-1 text-sm font-medium text-primary">
              {t("viewAll")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="space-y-2">
            {prices.isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
              : topToday.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {row.crop}
                        {row.variety ? ` · ${row.variety}` : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{row.market}</p>
                    </div>
                    <span className="shrink-0 font-display font-bold text-primary">
                      ₹{Number(row.price).toLocaleString("en-IN")}
                    </span>
                  </li>
                ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

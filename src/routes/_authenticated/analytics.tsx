import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IndianRupee, PackageCheck, Sprout, TrendingDown, TrendingUp } from "lucide-react";

import { useLang } from "@/lib/i18n";
import {
  analysesQuery,
  latestByCropMandi,
  marketPricesQuery,
  myListingsQuery,
  soilTestsQuery,
} from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Farm Analytics — SasyaVediX" },
      {
        name: "description",
        content: "Price trends, listing performance, expected sale value and farm activity.",
      },
      { property: "og:title", content: "Farm Analytics — SasyaVediX" },
      {
        property: "og:description",
        content: "Track mandi price trends and your own selling performance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

type Listing = {
  id: string;
  crop: string;
  quantity: number;
  expected_price: number;
  status: string;
  created_at: string;
};

const COLORS = ["#3f8f5f", "#d9a441", "#8a6a4f", "#5f9ea0", "#b5654a", "#7b8f3f"];

function AnalyticsPage() {
  const { lang } = useLang();
  const prices = useQuery(marketPricesQuery);
  const listings = useQuery(myListingsQuery);
  const analyses = useQuery(analysesQuery);
  const soil = useQuery(soilTestsQuery);

  const rows = prices.data ?? [];
  const cropOptions = useMemo(() => [...new Set(rows.map((r) => r.crop))].sort(), [rows]);
  const [crop, setCrop] = useState("");
  const activeCrop = crop || cropOptions[0] || "";

  const trend = useMemo(() => {
    const byDate = new Map<string, number[]>();
    for (const r of rows.filter((r) => r.crop === activeCrop)) {
      const arr = byDate.get(r.observed_on) ?? [];
      arr.push(Number(r.price));
      byDate.set(r.observed_on, arr);
    }
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, vals]) => ({
        date: date.slice(5),
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }));
  }, [rows, activeCrop]);

  const change =
    trend.length > 1 ? ((trend.at(-1)!.avg - trend[0]!.avg) / trend[0]!.avg) * 100 : 0;

  const myListings = (listings.data ?? []) as unknown as Listing[];
  const totalQty = myListings.reduce((a, l) => a + Number(l.quantity ?? 0), 0);
  const expectedValue = myListings.reduce(
    (a, l) => a + Number(l.quantity ?? 0) * Number(l.expected_price ?? 0),
    0,
  );
  const sold = myListings.filter((l) => l.status === "sold");
  const soldValue = sold.reduce(
    (a, l) => a + Number(l.quantity ?? 0) * Number(l.expected_price ?? 0),
    0,
  );

  const byCrop = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of myListings)
      m.set(l.crop, (m.get(l.crop) ?? 0) + Number(l.quantity ?? 0));
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [myListings]);

  const mandiCompare = useMemo(
    () =>
      latestByCropMandi(rows)
        .filter((r) => r.crop === activeCrop)
        .map((r) => ({ name: r.market, price: Number(r.price) }))
        .sort((a, b) => b.price - a.price)
        .slice(0, 6),
    [rows, activeCrop],
  );

  const activity = [
    {
      label: lang === "hi" ? "फसल सूचियां" : "Crop listings",
      value: myListings.length,
      icon: PackageCheck,
    },
    {
      label: lang === "hi" ? "फोटो जांच" : "Photo checks",
      value: (analyses.data ?? []).length,
      icon: Sprout,
    },
    {
      label: lang === "hi" ? "मृदा रिपोर्ट" : "Soil tests",
      value: (soil.data ?? []).length,
      icon: TrendingUp,
    },
  ];

  if (prices.isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {lang === "hi" ? "विश्लेषण" : "Farm Analytics"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "hi"
              ? "भाव का रुझान, आपकी बिक्री और गतिविधि एक जगह।"
              : "Price trends, your selling performance and farm activity in one place."}
          </p>
        </div>
        <select
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm"
          value={activeCrop}
          onChange={(e) => setCrop(e.target.value)}
        >
          {cropOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={change >= 0 ? TrendingUp : TrendingDown}
          label={lang === "hi" ? `${activeCrop} भाव बदलाव` : `${activeCrop} price change`}
          value={`${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
          tone={change >= 0 ? "text-primary" : "text-destructive"}
        />
        <Kpi
          icon={PackageCheck}
          label={lang === "hi" ? "सूचीबद्ध मात्रा" : "Listed quantity"}
          value={`${totalQty.toFixed(1)} ${lang === "hi" ? "क्विंटल" : "quintal"}`}
        />
        <Kpi
          icon={IndianRupee}
          label={lang === "hi" ? "अपेक्षित मूल्य" : "Expected value"}
          value={`₹${expectedValue.toLocaleString("en-IN")}`}
        />
        <Kpi
          icon={IndianRupee}
          label={lang === "hi" ? "बिक चुका मूल्य" : "Sold value"}
          value={`₹${soldValue.toLocaleString("en-IN")}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-3xl p-5">
          <h2 className="font-display text-xl font-semibold">
            {lang === "hi" ? `${activeCrop} का भाव रुझान` : `${activeCrop} price trend`}
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="an" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3f8f5f" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#3f8f5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} domain={["auto", "auto"]} />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Area dataKey="avg" stroke="#3f8f5f" fill="url(#an)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <h2 className="font-display text-xl font-semibold">
            {lang === "hi" ? "मंडी तुलना (आज)" : "Mandi comparison (today)"}
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mandiCompare}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Bar dataKey="price" fill="#d9a441" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <h2 className="font-display text-xl font-semibold">
            {lang === "hi" ? "फसलवार सूची" : "Listings by crop"}
          </h2>
          {byCrop.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {lang === "hi"
                ? "अभी कोई फसल सूचीबद्ध नहीं।"
                : "You have not listed any crop yet."}
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCrop} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byCrop.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="glass-card rounded-3xl p-5">
          <h2 className="font-display text-xl font-semibold">
            {lang === "hi" ? "आपकी गतिविधि" : "Your activity"}
          </h2>
          <div className="mt-4 space-y-3">
            {activity.map((a) => (
              <div
                key={a.label}
                className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-4"
              >
                <span className="flex items-center gap-3 text-sm">
                  <a.icon className="h-5 w-5 text-primary" />
                  {a.label}
                </span>
                <span className="font-display text-2xl font-bold">{a.value}</span>
              </div>
            ))}
            <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              {lang === "hi"
                ? `कुल ${myListings.length} सूचियों में से ${sold.length} बिक चुकी हैं।`
                : `${sold.length} of your ${myListings.length} listings are marked sold.`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "text-primary",
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`h-4 w-4 ${tone}`} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

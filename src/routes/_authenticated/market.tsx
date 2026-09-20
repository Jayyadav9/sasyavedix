import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, ArrowUpDown, Loader2, RefreshCw, Scale, TrendingUp, TrendingDown, Pause, ExternalLink, Landmark } from "lucide-react";
import { toast } from "sonner";

import { useLang } from "@/lib/i18n";
import {
  latestByCropMandi,
  marketPricesQuery,
  mspQuery,
  type MarketPrice,
} from "@/lib/queries";
import { sellAdvice } from "@/lib/sell-advice";
import { OFFICIAL_SOURCES } from "@/lib/sources";
import { syncMandiPrices } from "@/lib/mandi.functions";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";


export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({
    meta: [
      { title: "Live Mandi Prices — SasyaVediX" },
      {
        name: "description",
        content: "Search and filter live mandi prices by crop, variety, location and date.",
      },
      { property: "og:title", content: "Live Mandi Prices — SasyaVediX" },
      { property: "og:description", content: "Latest Indian mandi prices for major crops." },
    ],
  }),
  component: MarketPage,
});

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-input bg-card px-3 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function MarketPage() {
  const { t, lang } = useLang();
  const { data, isLoading } = useQuery(marketPricesQuery);
  const msp = useQuery(mspQuery);
  const qc = useQueryClient();
  const refresh = useMutation({
    mutationFn: () => syncMandiPrices(),
    onSuccess: (res) => {
      if (!res.configured) {
        toast.info(
          lang === "hi"
            ? "लाइव मंडी फ़ीड अभी जुड़ी नहीं है।"
            : "The live mandi feed is not connected yet.",
        );
        return;
      }
      if (res.inserted === 0) {
        toast.info(
          lang === "hi" ? "आज आपके जिलों के भाव नहीं मिले।" : "No fresh rates for your districts.",
        );
        return;
      }
      qc.invalidateQueries({ queryKey: ["market_prices"] });
      toast.success(
        lang === "hi" ? `${res.inserted} भाव अपडेट हुए` : `${res.inserted} rates updated`,
      );
    },
    onError: () =>
      toast.error(lang === "hi" ? "भाव नहीं मिल सके" : "Could not fetch today's rates"),
  });

  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("All");
  const [variety, setVariety] = useState("All");
  const [location, setLocation] = useState("All");
  const [sortDesc, setSortDesc] = useState(true);
  const [historyMode, setHistoryMode] = useState(false);

  const rows: MarketPrice[] = useMemo(() => {
    const base = data ?? [];
    return historyMode ? base : latestByCropMandi(base);
  }, [data, historyMode]);

  const crops = useMemo(() => ["All", ...new Set((data ?? []).map((r) => r.crop))], [data]);
  const varieties = useMemo(
    () => [
      "All",
      ...new Set(
        (data ?? [])
          .filter((r) => crop === "All" || r.crop === crop)
          .map((r) => r.variety ?? "")
          .filter(Boolean),
      ),
    ],
    [data, crop],
  );
  const locations = useMemo(() => ["All", ...new Set((data ?? []).map((r) => r.location))], [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (crop === "All" || r.crop === crop) &&
        (variety === "All" || r.variety === variety) &&
        (location === "All" || r.location === location) &&
        (!q ||
          `${r.crop} ${r.variety ?? ""} ${r.location} ${r.market}`.toLowerCase().includes(q)),
    );
    return out.sort((a, b) => (sortDesc ? b.price - a.price : a.price - b.price));
  }, [rows, crop, variety, location, search, sortDesc]);

  const advice = useMemo(
    () => (crop === "All" ? null : sellAdvice(crop, data ?? [], msp.data ?? [])),
    [crop, data, msp.data],
  );

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const p = filtered.map((r) => Number(r.price));
    return {
      high: Math.max(...p),
      low: Math.min(...p),
      avg: Math.round(p.reduce((a, b) => a + b, 0) / p.length),
    };
  }, [filtered]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("marketPrices")}</h1>
          <p className="text-muted-foreground">
            {historyMode ? "Full price history" : "Latest price per crop and mandi"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            {refresh.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {lang === "hi" ? "आज के भाव लाएं" : "Fetch today's rates"}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/mandi-setup">
              <Landmark className="mr-2 h-4 w-4" />
              {lang === "hi" ? "असली भाव जोड़ें" : "Connect live rates"}
            </Link>
          </Button>
        </div>
      </header>


      <div className="glass-card space-y-4 rounded-3xl p-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t("search")} — ${t("crop")} / ${t("mandi")}`}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select label={t("crop")} value={crop} onChange={(v) => { setCrop(v); setVariety("All"); }} options={crops} />
          <Select label={t("variety")} value={variety} onChange={setVariety} options={varieties} />
          <Select label={t("location")} value={location} onChange={setLocation} options={locations} />
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => setSortDesc((s) => !s)}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              {sortDesc ? t("highest") : t("lowest")}
            </Button>
            <Button
              variant={historyMode ? "default" : "outline"}
              onClick={() => setHistoryMode((h) => !h)}
            >
              History
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("highest"), value: stats.high },
              { label: t("average"), value: stats.avg },
              { label: t("lowest"), value: stats.low },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-muted/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">
                  ₹{s.value.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {msp.data && msp.data.length > 0 && (
        <section className="glass-card rounded-3xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-lg font-bold">{t("govtMsp")}</h2>
              <p className="text-xs text-muted-foreground">{t("govtMspHint")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {msp.data.map((m) => (
              <a
                key={m.id}
                href={m.source_url ?? "https://farmer.gov.in/mspstatements.aspx"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-2 text-sm transition hover:bg-muted"
              >
                <span className="font-medium">{m.crop}</span>
                <span className="font-display font-bold text-primary">
                  ₹{Number(m.msp).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {m.season} {m.year}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </section>
      )}


      {crop !== "All" && advice && (
        <section className="glass-card rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl ${
                  advice.signal === "sell"
                    ? "gradient-field text-primary-foreground"
                    : advice.signal === "wait"
                      ? "gradient-harvest text-accent-foreground"
                      : "bg-muted"
                }`}
              >
                {advice.signal === "sell" ? (
                  <TrendingUp className="h-5 w-5" />
                ) : advice.signal === "wait" ? (
                  <TrendingDown className="h-5 w-5" />
                ) : (
                  <Pause className="h-5 w-5" />
                )}
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">
                  {t("sellAdvisor")} — {crop}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {advice.signal === "sell"
                    ? t("sellNow")
                    : advice.signal === "wait"
                      ? t("waitBetter")
                      : t("holdSteady")}
                  {" · "}₹{advice.latest.toLocaleString("en-IN")} · {advice.market}
                </p>
              </div>
            </div>
            {advice.msp != null && (
              <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-2">
                <Scale className="h-4 w-4 text-primary" />
                <p className="text-sm">
                  {t("mspLabel")} ₹{advice.msp.toLocaleString("en-IN")} —{" "}
                  <span className={advice.aboveMsp ? "font-semibold text-primary" : "font-semibold text-destructive"}>
                    {advice.aboveMsp
                      ? lang === "hi"
                        ? "ऊपर"
                        : "above"
                      : lang === "hi"
                        ? "नीचे"
                        : "below"}
                  </span>
                </p>
              </div>
            )}
          </div>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {(lang === "hi" ? advice.reasons_hi : advice.reasons_en).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="glass-card overflow-hidden rounded-3xl">
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">{t("noResults")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-secondary-foreground">
                <tr>
                  {[t("crop"), t("variety"), t("location"), t("mandi"), t("price"), t("date"), t("source")].map(
                    (h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((r) => (
                  <tr key={r.id} className="border-t border-border/70 hover:bg-muted/50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{r.crop}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.variety ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.location}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.market}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-display font-bold text-primary">
                      ₹{Number(r.price).toLocaleString("en-IN")}{" "}
                      <span className="text-xs font-normal text-muted-foreground">{r.unit}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{r.observed_on}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <section className="glass-card rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-bold">{t("officialSources")}</h2>
            <p className="text-xs text-muted-foreground">{t("officialSourcesHint")}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OFFICIAL_SOURCES.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-border/70 bg-card p-4 transition hover:border-primary/50"
            >
              <p className="flex items-center justify-between font-semibold">
                {lang === "hi" ? s.name_hi : s.name_en}
                <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lang === "hi" ? s.desc_hi : s.desc_en}
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

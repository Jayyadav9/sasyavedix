import { Leaf, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { NUTRIENT_LABELS, rate, ratingLabel, recommendations } from "@/lib/soil";
import type { SoilTest } from "@/lib/queries";

const KEYS = ["ph", "ec", "nitrogen", "phosphorus", "potassium", "organic_carbon"] as const;

function toneOf(r: "low" | "ok" | "high") {
  return r === "ok" ? "text-primary" : r === "low" ? "text-destructive" : "text-warning";
}

function barOf(r: "low" | "ok" | "high") {
  return r === "ok" ? "bg-primary" : r === "low" ? "bg-destructive" : "bg-warning";
}

export function SoilCard({ test, farmer }: { test: SoilTest; farmer: string }) {
  const { lang } = useLang();
  const values = {
    ph: Number(test.ph),
    nitrogen: Number(test.nitrogen),
    phosphorus: Number(test.phosphorus),
    potassium: Number(test.potassium),
    organic_carbon: test.organic_carbon === null ? null : Number(test.organic_carbon),
  };
  const advice = recommendations(values, lang).slice(0, 4);

  return (
    <div id="soil-card" className="glass-card overflow-hidden rounded-3xl">
      <div className="flex items-start justify-between gap-4 gradient-field px-6 py-5 text-primary-foreground">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Leaf className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">SasyaVediX</p>
            <h2 className="font-display text-2xl font-bold">
              {lang === "hi" ? "मृदा स्वास्थ्य कार्ड" : "Soil Health Card"}
            </h2>
            <p className="text-sm opacity-85">
              {farmer}
              {test.location ? ` · ${test.location}` : ""} · {test.sample_date}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="no-print shrink-0"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          {lang === "hi" ? "प्रिंट" : "Print"}
        </Button>
      </div>

      <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {KEYS.map((k) => {
          const raw = k === "ec" ? test.ec : (values as Record<string, number | null>)[k];
          const value = raw === null || raw === undefined ? null : Number(raw);
          const r = k === "ec" ? "ok" : rate(k as keyof typeof values, value);
          const pct =
            value === null
              ? 0
              : Math.max(8, Math.min(100, k === "ph" ? (value / 14) * 100 : (value / 400) * 100));
          return (
            <div key={k} className="rounded-2xl border border-border bg-card/60 p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-muted-foreground">
                  {k === "ec" ? "EC (dS/m)" : NUTRIENT_LABELS[k as keyof typeof values]![lang]}
                </p>
                {k !== "ec" && (
                  <span className={`text-xs font-semibold ${toneOf(r)}`}>
                    {ratingLabel(r, lang)}
                  </span>
                )}
              </div>
              <p className="font-display text-2xl font-bold">
                {value ?? "—"}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {k === "ec"
                    ? "dS/m"
                    : NUTRIENT_LABELS[k as keyof typeof values]!.unit}
                </span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${barOf(r)}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-6 py-5">
        <h3 className="font-display font-semibold">
          {lang === "hi" ? "मुख्य सलाह" : "Key advice"}
        </h3>
        <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          {advice.map((a, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {a}
            </li>
          ))}
        </ul>
        {test.target_crop && (
          <p className="mt-3 text-xs text-muted-foreground">
            {lang === "hi" ? "अगली फसल" : "Next crop"}: {test.target_crop}
          </p>
        )}
      </div>
    </div>
  );
}

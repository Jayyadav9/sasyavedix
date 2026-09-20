import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FlaskConical, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { profileQuery, soilTestsQuery, type SoilTest } from "@/lib/queries";
import { SoilCard } from "@/components/soil-card";

import {
  GUIDE_CROPS,
  NUTRIENT_LABELS,
  cropGuidance,
  rate,
  ratingLabel,
  recommendations,
} from "@/lib/soil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/soil")({
  head: () => ({
    meta: [
      { title: "Soil Health — SasyaVediX" },
      {
        name: "description",
        content: "Record soil test results and get fertiliser and crop-specific guidance per acre.",
      },
      { property: "og:title", content: "Soil Health — SasyaVediX" },
      {
        property: "og:description",
        content: "Soil test tracking with nutrient ratings and per-acre fertiliser advice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SoilPage,
});

const empty = {
  sample_date: new Date().toISOString().slice(0, 10),
  location: "",
  ph: "",
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  organic_carbon: "",
  ec: "",
  target_crop: "",
  notes: "",
};

function SoilPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const tests = useQuery(soilTestsQuery);
  const profile = useQuery(profileQuery);

  const [form, setForm] = useState(empty);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("soil_tests").insert({
        farmer_id: auth.user.id,
        sample_date: form.sample_date,
        location: form.location || null,
        ph: Number(form.ph),
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        organic_carbon: form.organic_carbon ? Number(form.organic_carbon) : null,
        ec: form.ec ? Number(form.ec) : null,
        target_crop: form.target_crop || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["soil_tests"] });
      toast.success(lang === "hi" ? "मृदा रिपोर्ट सहेजी गई" : "Soil test saved");
    },
    onError: () =>
      toast.error(lang === "hi" ? "सहेजा नहीं जा सका" : "Could not save the soil test"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("soil_tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["soil_tests"] }),
  });

  const rows = tests.data ?? [];
  const latest: SoilTest | undefined = rows[0];
  const trend = [...rows]
    .reverse()
    .map((r) => ({ date: r.sample_date.slice(5), ph: Number(r.ph), oc: Number(r.organic_carbon ?? 0) }));

  const valid =
    form.ph !== "" && form.nitrogen !== "" && form.phosphorus !== "" && form.potassium !== "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          {lang === "hi" ? "मृदा स्वास्थ्य" : "Soil Health"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "hi"
            ? "मृदा जांच रिपोर्ट दर्ज करें और खाद व फसल की सटीक सलाह पाएं।"
            : "Enter your soil test card values and get fertiliser and crop guidance."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="glass-card rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <FlaskConical className="h-5 w-5 text-primary" />
            {lang === "hi" ? "नई जांच जोड़ें" : "Add a soil test"}
          </h2>
          <div className="mt-4 grid gap-3">
            <Field
              label={lang === "hi" ? "नमूने की तारीख" : "Sample date"}
              type="date"
              value={form.sample_date}
              onChange={(v) => setForm({ ...form, sample_date: v })}
            />
            <Field
              label={lang === "hi" ? "खेत / गांव" : "Field / village"}
              value={form.location}
              onChange={(v) => setForm({ ...form, location: v })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="pH"
                type="number"
                value={form.ph}
                onChange={(v) => setForm({ ...form, ph: v })}
              />
              <Field
                label="EC (dS/m)"
                type="number"
                value={form.ec}
                onChange={(v) => setForm({ ...form, ec: v })}
              />
              <Field
                label="N (kg/ha)"
                type="number"
                value={form.nitrogen}
                onChange={(v) => setForm({ ...form, nitrogen: v })}
              />
              <Field
                label="P (kg/ha)"
                type="number"
                value={form.phosphorus}
                onChange={(v) => setForm({ ...form, phosphorus: v })}
              />
              <Field
                label="K (kg/ha)"
                type="number"
                value={form.potassium}
                onChange={(v) => setForm({ ...form, potassium: v })}
              />
              <Field
                label={lang === "hi" ? "जैविक कार्बन %" : "Organic carbon %"}
                type="number"
                value={form.organic_carbon}
                onChange={(v) => setForm({ ...form, organic_carbon: v })}
              />
            </div>
            <div>
              <Label>{lang === "hi" ? "अगली फसल" : "Next crop"}</Label>
              <select
                className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                value={form.target_crop}
                onChange={(e) => setForm({ ...form, target_crop: e.target.value })}
              >
                <option value="">{lang === "hi" ? "चुनें" : "Select"}</option>
                {GUIDE_CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lang === "hi" ? "रिपोर्ट सहेजें" : "Save soil test"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {tests.isLoading ? (
            <Skeleton className="h-52 rounded-3xl" />
          ) : !latest ? (
            <div className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">
              {lang === "hi"
                ? "अभी कोई मृदा रिपोर्ट नहीं। पहली जांच जोड़ें।"
                : "No soil tests yet. Add your first test card values."}
            </div>
          ) : (
            <>
              <SoilCard test={latest} farmer={profile.data?.full_name ?? "Farmer"} />

              <div className="glass-card rounded-3xl p-5">
                <h2 className="font-display text-xl font-semibold">

                  {lang === "hi" ? "नवीनतम रिपोर्ट" : "Latest report"}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    · {latest.sample_date} {latest.location ? `· ${latest.location}` : ""}
                  </span>
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {(
                    ["ph", "nitrogen", "phosphorus", "potassium", "organic_carbon"] as const
                  ).map((k) => {
                    const value = latest[k] === null ? null : Number(latest[k]);
                    const r = rate(k, value);
                    const tone =
                      r === "ok"
                        ? "text-primary"
                        : r === "low"
                          ? "text-destructive"
                          : "text-warning";
                    return (
                      <div key={k} className="rounded-2xl border border-border bg-card/60 p-3">
                        <p className="text-xs text-muted-foreground">
                          {NUTRIENT_LABELS[k]![lang]}
                        </p>
                        <p className="font-display text-2xl font-bold">
                          {value ?? "—"}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {NUTRIENT_LABELS[k]!.unit}
                          </span>
                        </p>
                        <p className={`text-xs font-medium ${tone}`}>{ratingLabel(r, lang)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card rounded-3xl p-5">
                <h2 className="font-display text-xl font-semibold">
                  {lang === "hi" ? "सिफारिशें" : "Recommendations"}
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {recommendations(
                    {
                      ph: Number(latest.ph),
                      nitrogen: Number(latest.nitrogen),
                      phosphorus: Number(latest.phosphorus),
                      potassium: Number(latest.potassium),
                      organic_carbon:
                        latest.organic_carbon === null ? null : Number(latest.organic_carbon),
                    },
                    lang,
                  ).map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>

                {latest.target_crop && (
                  <>
                    <h3 className="mt-5 font-display font-semibold">
                      {lang === "hi"
                        ? `${latest.target_crop} के लिए सलाह`
                        : `Guidance for ${latest.target_crop}`}
                    </h3>
                    <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                      {cropGuidance(
                        latest.target_crop,
                        {
                          ph: Number(latest.ph),
                          nitrogen: Number(latest.nitrogen),
                          phosphorus: Number(latest.phosphorus),
                          potassium: Number(latest.potassium),
                          organic_carbon:
                            latest.organic_carbon === null ? null : Number(latest.organic_carbon),
                        },
                        lang,
                      ).map((g, i) => (
                        <li key={i}>• {g}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {trend.length > 1 && (
                <div className="glass-card rounded-3xl p-5">
                  <h2 className="font-display text-xl font-semibold">
                    {lang === "hi" ? "मिट्टी का रुझान" : "Soil trend"}
                  </h2>
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="ph" stroke="hsl(var(--primary))" />
                        <Line type="monotone" dataKey="oc" stroke="hsl(var(--accent))" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="glass-card rounded-3xl p-5">
                <h2 className="font-display text-xl font-semibold">
                  {lang === "hi" ? "सभी रिपोर्ट" : "All tests"}
                </h2>
                <div className="mt-3 space-y-2">
                  {rows.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 text-sm"
                    >
                      <span>
                        {r.sample_date} · pH {Number(r.ph)} · N {Number(r.nitrogen)} · P{" "}
                        {Number(r.phosphorus)} · K {Number(r.potassium)}
                        {r.location ? ` · ${r.location}` : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(r.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-1"
        type={type}
        value={value}
        step="any"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Camera, Leaf, Loader2, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { analyzeCropImage } from "@/lib/ai.functions";
import { analysesQuery, marketPricesQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Crop Photo Analysis — SasyaVediX" },
      {
        name: "description",
        content: "Upload a crop photo and get an AI health score, diagnosis and treatment plan.",
      },
      { property: "og:title", content: "Crop Photo Analysis — SasyaVediX" },
      {
        property: "og:description",
        content: "AI crop disease and nutrient diagnosis from a single field photo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalysisPage,
});

type Result = {
  crop_guess: string;
  status: string;
  health_score: number;
  diagnosis: string;
  recommendations: string[];
  prevention: string[];
  urgency: string;
};

function AnalysisPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeCropImage);
  const prices = useQuery(marketPricesQuery);
  const history = useQuery(analysesQuery);
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [crop, setCrop] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const cropOptions = [...new Set((prices.data ?? []).map((p) => p.crop))];

  const run = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("no file");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const path = `${auth.user.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("crop-images").upload(path, file);
      if (up.error) throw up.error;
      const signed = await supabase.storage.from("crop-images").createSignedUrl(path, 900);
      if (signed.error || !signed.data) throw signed.error ?? new Error("Signed URL failed");

      const out = (await analyze({
        data: { imageUrl: signed.data.signedUrl, crop, lang },
      })) as Result;

      const { error } = await supabase.from("crop_analysis").insert({
        farmer_id: auth.user.id,
        crop: crop || out.crop_guess,
        image_url: path,
        health_score: Math.round(out.health_score),
        status: out.status,
        diagnosis: out.diagnosis,
        recommendations: out.recommendations,
      });
      if (error) throw error;
      return out;
    },
    onSuccess: (out) => {
      setResult(out);
      qc.invalidateQueries({ queryKey: ["crop_analysis"] });
      toast.success(lang === "hi" ? "विश्लेषण तैयार है" : "Analysis ready");
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("configured")
          ? e.message
          : lang === "hi"
            ? "विश्लेषण नहीं हो सका, दोबारा कोशिश करें।"
            : "Could not analyse the photo. Please try again.",
      ),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          {lang === "hi" ? "फसल फोटो विश्लेषण" : "Crop Photo Analysis"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "hi"
            ? "पत्ती या पौधे की साफ फोटो भेजें — रोग, कमी और इलाज तुरंत जानें।"
            : "Send a clear photo of a leaf or plant to get the disease, deficiency and treatment."}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-3xl p-5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border p-6 text-center transition hover:border-primary"
          >
            {preview ? (
              <img src={preview} alt="Crop" className="max-h-64 rounded-xl object-contain" />
            ) : (
              <>
                <Camera className="h-10 w-10 text-primary" />
                <p className="mt-3 text-sm font-medium">
                  {lang === "hi" ? "फोटो चुनें या खींचें" : "Choose or take a photo"}
                </p>
                <p className="text-xs text-muted-foreground">JPG / PNG · max 10 MB</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFile(f);
              setResult(null);
              setPreview(URL.createObjectURL(f));
            }}
          />

          <label className="mt-4 block text-sm font-medium">
            {lang === "hi" ? "फसल (वैकल्पिक)" : "Crop (optional)"}
          </label>
          <select
            className="mt-1 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          >
            <option value="">{lang === "hi" ? "एआई खुद पहचाने" : "Let the AI identify it"}</option>
            {cropOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <Button
            className="mt-4 w-full"
            disabled={!file || run.isPending}
            onClick={() => run.mutate()}
          >
            {run.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {run.isPending
              ? lang === "hi"
                ? "जांच हो रही है…"
                : "Analysing…"
              : lang === "hi"
                ? "फसल की जांच करें"
                : "Analyse my crop"}
          </Button>
        </div>

        <div className="glass-card rounded-3xl p-5">
          {!result ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div>
                <Leaf className="mx-auto h-10 w-10 text-primary/50" />
                <p className="mt-3">
                  {lang === "hi"
                    ? "जांच का परिणाम यहां दिखेगा।"
                    : "Your health report will appear here."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {result.crop_guess}
                  </p>
                  <h2 className="font-display text-2xl font-bold">{result.status}</h2>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl font-bold text-primary">
                    {Math.round(result.health_score)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lang === "hi" ? "स्वास्थ्य स्कोर" : "Health score"}
                  </p>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full gradient-field"
                  style={{ width: `${Math.min(100, Math.max(0, result.health_score))}%` }}
                />
              </div>
              <p className="text-sm">{result.diagnosis}</p>
              <div>
                <h3 className="font-display font-semibold">
                  {lang === "hi" ? "क्या करें" : "What to do now"}
                </h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              {result.prevention?.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-display font-semibold">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {lang === "hi" ? "आगे बचाव" : "Prevent it next time"}
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {result.prevention.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {lang === "hi" ? "गंभीरता" : "Urgency"}: {result.urgency}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5">
        <h2 className="font-display text-xl font-semibold">
          {lang === "hi" ? "पिछली जांच" : "Past checks"}
        </h2>
        {history.isLoading ? (
          <Skeleton className="mt-4 h-24 rounded-2xl" />
        ) : (history.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {lang === "hi" ? "अभी कोई जांच नहीं।" : "No checks yet."}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(history.data ?? []).map((row) => (
              <div key={row.id} className="rounded-2xl border border-border bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{row.crop}</p>
                  <span className="font-display text-lg font-bold text-primary">
                    {row.health_score}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.status} · {new Date(row.created_at as string).toLocaleDateString("en-IN")}
                </p>
                <p className="mt-2 line-clamp-3 text-sm">{row.diagnosis}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

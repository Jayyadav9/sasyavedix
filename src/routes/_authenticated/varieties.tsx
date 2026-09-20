import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Droplets, CalendarDays, Wheat } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { varietiesQuery } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/varieties")({
  head: () => ({
    meta: [
      { title: "Crop Varieties — SasyaVediX" },
      {
        name: "description",
        content: "Compare crop varieties by duration, yield, season and water need.",
      },
      { property: "og:title", content: "Crop Varieties — SasyaVediX" },
      { property: "og:description", content: "Variety-level guidance for Indian crops." },
    ],
  }),
  component: VarietiesPage,
});

function VarietiesPage() {
  const { t, lang } = useLang();
  const { data, isLoading } = useQuery(varietiesQuery);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (v) => !q || `${v.crop} ${v.name_en} ${v.name_hi}`.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("cropVarieties")}</h1>
        <p className="text-muted-foreground">{t("search")} — {t("crop")} / {t("variety")}</p>
      </header>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("search")}
        className="max-w-md"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <article key={v.id} className="glass-card lift-hover rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{v.crop}</p>
              <h2 className="mt-1 font-display text-xl font-bold">
                {lang === "hi" ? v.name_hi : v.name_en}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {lang === "hi" ? v.notes_hi : v.notes_en}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {v.duration_days} {t("days")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wheat className="h-4 w-4 text-muted-foreground" />
                  <span>{v.yield_quintal_per_acre} q/acre</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-muted-foreground" />
                  <span>{v.water_need}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent/25 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    {v.season}
                  </span>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

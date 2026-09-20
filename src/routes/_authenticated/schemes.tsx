import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { schemesQuery } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/schemes")({
  head: () => ({
    meta: [
      { title: "Government Schemes — SasyaVediX" },
      {
        name: "description",
        content: "Central government farming schemes, benefits and eligibility in Hindi and English.",
      },
      { property: "og:title", content: "Government Schemes — SasyaVediX" },
      { property: "og:description", content: "PM-KISAN, PMFBY, KCC and more for Indian farmers." },
    ],
  }),
  component: SchemesPage,
});

function SchemesPage() {
  const { t, lang } = useLang();
  const { data, isLoading } = useQuery(schemesQuery);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("schemes")}</h1>
        <p className="text-muted-foreground">{t("activeSchemes")}: {data?.length ?? 0}</p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data ?? []).map((s) => (
            <article key={s.id} className="glass-card lift-hover rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-bold">
                  {lang === "hi" ? s.name_hi : s.name_en}
                </h2>
                <span className="shrink-0 rounded-full bg-accent/25 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  {s.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {lang === "hi" ? s.description_hi : s.description_en}
              </p>
              <dl className="mt-4 space-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="font-semibold">Benefit:</dt>
                  <dd>{s.benefit}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold">Eligibility:</dt>
                  <dd>{s.eligibility}</dd>
                </div>
              </dl>
              {s.link && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Official site <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

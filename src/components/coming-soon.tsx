import { Sparkles } from "lucide-react";
import { useLang, type TKey } from "@/lib/i18n";

export function ComingSoon({ titleKey, bullets }: { titleKey: TKey; bullets: string[] }) {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-3xl">
      <div className="glass-card rounded-3xl p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-harvest">
          <Sparkles className="h-6 w-6 text-accent-foreground" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold">{t(titleKey)}</h1>
        <p className="mt-1 text-muted-foreground">{t("comingSoon")}</p>
        <ul className="mt-5 space-y-2 text-sm">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

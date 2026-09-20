import { Check } from "lucide-react";

import { ORDER_FLOW, ORDER_LABELS } from "@/lib/queries";
import { useLang } from "@/lib/i18n";

export function OrderTrack({ status }: { status: string }) {
  const { lang } = useLang();
  const idx = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);

  if (status === "cancelled") {
    return (
      <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
        {ORDER_LABELS["cancelled"]![lang]}
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {ORDER_FLOW.map((step, i) => {
        const done = i <= idx;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {done && <Check className="h-3 w-3" />}
              {ORDER_LABELS[step]![lang]}
            </span>
            {i < ORDER_FLOW.length - 1 && (
              <span className={`h-px w-4 ${i < idx ? "bg-primary" : "bg-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import type { Order, Payment } from "@/lib/queries";

export function Invoice({
  order,
  payments,
  sellerName,
  sellerPlace,
}: {
  order: Order & { invoice_no?: string | null };
  payments: Payment[];
  sellerName?: string | null;
  sellerPlace?: string | null;
}) {
  const { t, lang } = useLang();
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(order.total_amount) - paid;
  const money = (n: number) => `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <div id="soil-card" className="glass-card rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-display text-2xl font-bold">
            {lang === "hi" ? "बिक्री बिल" : "Sale Invoice"}
          </p>
          <p className="text-sm text-muted-foreground">SasyaVediX · {order.invoice_no ?? order.id.slice(0, 8)}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{sellerName ?? t("farmer")}</p>
          {sellerPlace && <p className="text-muted-foreground">{sellerPlace}</p>}
          <p className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="py-2">{t("crop")}</th>
            <th className="py-2">{t("quantity")}</th>
            <th className="py-2">{t("price")}</th>
            <th className="py-2 text-right">{t("total")}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border">
            <td className="py-3 font-medium">
              {order.crop}
              {order.variety ? ` · ${order.variety}` : ""}
            </td>
            <td className="py-3">{order.quantity} {lang === "hi" ? "क्विंटल" : "quintal"}</td>
            <td className="py-3">{money(order.price_per_quintal)}</td>
            <td className="py-3 text-right font-semibold">{money(order.total_amount)}</td>
          </tr>
        </tbody>
      </table>

      {payments.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          {payments.map((p) => (
            <li key={p.id} className="flex justify-between text-muted-foreground">
              <span>
                {new Date(`${p.paid_on}T00:00:00`).toLocaleDateString("en-IN")} · {p.method}
                {p.reference ? ` · ${p.reference}` : ""}
              </span>
              <span>{money(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <span>{t("paid")}</span>
          <span className="font-semibold">{money(paid)}</span>
        </div>
        <div className="flex justify-between font-display text-lg font-bold">
          <span>{t("balance")}</span>
          <span className={balance <= 0 ? "text-primary" : "text-destructive"}>{money(Math.max(balance, 0))}</span>
        </div>
      </div>

      <Button className="no-print mt-5" variant="outline" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        {t("print")}
      </Button>
    </div>
  );
}

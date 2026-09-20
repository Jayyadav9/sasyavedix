import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, BellRing, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import {
  latestByCropMandi,
  marketPricesQuery,
  notificationsQuery,
  priceAlertsQuery,
  type PriceAlert,
} from "@/lib/queries";
import { sendPriceAlertEmail } from "@/lib/alert-email.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Price Watch — SasyaVediX" },
      {
        name: "description",
        content:
          "Price alerts for your crops plus offer, order and weather updates in one place.",
      },
      { property: "og:title", content: "Alerts & Price Watch — SasyaVediX" },
      {
        property: "og:description",
        content: "Get told when your crop hits your target price and when buyers act.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const notifications = useQuery(notificationsQuery);
  const alerts = useQuery(priceAlertsQuery);
  const prices = useQuery(marketPricesQuery);

  const latest = latestByCropMandi(prices.data ?? []);

  function bestFor(a: PriceAlert) {
    const rows = latest.filter(
      (p) =>
        p.crop.toLowerCase() === a.crop.toLowerCase() &&
        (!a.market || p.market.toLowerCase() === a.market.toLowerCase()),
    );
    if (!rows.length) return null;
    return a.direction === "below"
      ? rows.reduce((m, r) => (r.price < m.price ? r : m))
      : rows.reduce((m, r) => (r.price > m.price ? r : m));
  }

  function isHit(a: PriceAlert) {
    const best = bestFor(a);
    if (!best) return false;
    return a.direction === "below" ? best.price <= a.target_price : best.price >= a.target_price;
  }

  // Raise a notification once a day for every alert whose target is met.
  useEffect(() => {
    if (!alerts.data || !prices.data) return;
    const today = new Date().toISOString().slice(0, 10);
    const due = alerts.data.filter(
      (a) =>
        a.active &&
        isHit(a) &&
        (a as PriceAlert & { last_notified_on?: string | null }).last_notified_on !== today,
    );
    if (!due.length) return;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      for (const a of due) {
        const best = bestFor(a);
        if (!best) continue;
        await supabase.from("notifications").insert({
          user_id: auth.user.id,
          kind: "price",
          title_en: `${a.crop} hit ₹${best.price}/quintal`,
          title_hi: `${a.crop} ₹${best.price}/क्विंटल पर पहुंचा`,
          body_en: `${best.market}, ${best.location} on ${best.observed_on}. Your target was ₹${a.target_price}.`,
          body_hi: `${best.market}, ${best.location} — ${best.observed_on}. आपका लक्ष्य ₹${a.target_price} था।`,
          link: "/market",
        });
        if ((a as PriceAlert & { notify_email?: boolean }).notify_email) {
          try {
            await sendPriceAlertEmail({
              data: { crop: a.crop, price: Number(best.price), market: best.market, target: a.target_price },
            });
          } catch {
            /* email is best effort */
          }
        }
        await supabase.from("price_alerts").update({ last_notified_on: today }).eq("id", a.id);
      }
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["price_alerts"] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.data, prices.data]);

  const addAlert = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fd = new FormData(form);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("not signed in");
      const { error } = await supabase.from("price_alerts").insert({
        farmer_id: auth.user.id,
        crop: String(fd.get("crop") ?? "").trim(),
        market: String(fd.get("market") ?? "").trim() || null,
        direction: String(fd.get("direction") ?? "above"),
        target_price: Number(fd.get("target_price")),
        notify_email: fd.get("notify_email") === "on",
      });
      if (error) throw error;
      form.reset();
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "अलर्ट जोड़ा गया" : "Alert added");
      qc.invalidateQueries({ queryKey: ["price_alerts"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add alert"),
  });

  const removeAlert = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price_alerts"] }),
  });

  const markRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const crops = [...new Set(latest.map((p) => p.crop))].sort();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("alerts")}</h1>
          <p className="text-muted-foreground">
            {lang === "hi"
              ? "भाव लक्ष्य, प्रस्ताव और ऑर्डर की सूचनाएं एक जगह।"
              : "Price targets, offers and order updates in one place."}
          </p>
        </div>
        <Button variant="outline" onClick={() => markRead.mutate()}>
          {t("markAllRead")}
        </Button>
      </header>

      <section className="glass-card rounded-3xl p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <BellRing className="h-5 w-5 text-primary" />
          {t("priceAlerts")}
        </h2>

        <form
          className="grid gap-3 sm:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            addAlert.mutate(e.currentTarget);
          }}
        >
          <div className="sm:col-span-2">
            <Label htmlFor="crop">{t("crop")}</Label>
            <input
              id="crop"
              name="crop"
              list="alert-crops"
              required
              className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            />
            <datalist id="alert-crops">
              {crops.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="direction">{t("status")}</Label>
            <select
              id="direction"
              name="direction"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="above">{t("above")}</option>
              <option value="below">{t("below")}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="target_price">{t("targetPrice")}</Label>
            <Input id="target_price" name="target_price" type="number" min="1" required className="mt-1" />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs">
              <input type="checkbox" id="notify_email" name="notify_email" />
              {t("emailMe")}
            </label>
            <Button type="submit" disabled={addAlert.isPending}>
              {t("addAlert")}
            </Button>
          </div>
        </form>

        <ul className="mt-5 space-y-2">
          {(alerts.data ?? []).map((a) => {
            const best = bestFor(a);
            const hit = isHit(a);
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      hit ? "gradient-harvest" : "bg-muted"
                    }`}
                  >
                    {a.direction === "below" ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold">
                      {a.crop} {a.direction === "below" ? "≤" : "≥"} ₹
                      {Number(a.target_price).toLocaleString("en-IN")}
                      {a.market ? ` · ${a.market}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {best
                        ? `${lang === "hi" ? "अभी" : "Now"} ₹${Number(best.price).toLocaleString("en-IN")} · ${best.market}`
                        : lang === "hi"
                          ? "भाव उपलब्ध नहीं"
                          : "No price yet"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      hit ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {hit ? t("triggered") : t("watching")}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => removeAlert.mutate(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <Bell className="h-5 w-5 text-primary" />
          {lang === "hi" ? "सूचनाएं" : "Notifications"}
        </h2>
        {notifications.isLoading ? (
          <Skeleton className="h-28 w-full rounded-3xl" />
        ) : (notifications.data ?? []).length === 0 ? (
          <p className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">{t("noAlerts")}</p>
        ) : (
          <ul className="space-y-2">
            {(notifications.data ?? []).map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border p-4 ${
                  n.read ? "border-border bg-card/40" : "border-primary/40 bg-card"
                }`}
              >
                <p className="font-semibold">{lang === "hi" ? n.title_hi : n.title_en}</p>
                {(lang === "hi" ? n.body_hi : n.body_en) && (
                  <p className="text-sm text-muted-foreground">
                    {lang === "hi" ? n.body_hi : n.body_en}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("en-IN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

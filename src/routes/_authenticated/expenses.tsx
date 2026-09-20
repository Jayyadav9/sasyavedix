import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, IndianRupee, Loader2, ReceiptIndianRupee, Trash2, TrendingUp, Wheat } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import { farmExpensesQuery, ordersQuery, type FarmExpense } from "@/lib/queries";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses & Profit — SasyaVediX" },
      {
        name: "description",
        content:
          "Track seed, fertiliser, diesel and labour costs per crop and see profit per acre after every sale.",
      },
      { property: "og:title", content: "Expenses & Profit — SasyaVediX" },
      {
        property: "og:description",
        content: "Farm expense tracking with crop-wise profit and per-acre returns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExpensesPage,
});

const CATEGORIES = [
  { id: "seed", en: "Seed", hi: "बीज" },
  { id: "fertiliser", en: "Fertiliser", hi: "खाद/उर्वरक" },
  { id: "diesel", en: "Diesel", hi: "डीजल" },
  { id: "labour", en: "Labour", hi: "मजदूरी" },
  { id: "spray", en: "Spray / Pesticide", hi: "दवा/छिड़काव" },
  { id: "irrigation", en: "Irrigation", hi: "सिंचाई" },
  { id: "other", en: "Other", hi: "अन्य" },
];

function ExpensesPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const qc = useQueryClient();
  const expenses = useQuery(farmExpensesQuery);
  const orders = useQuery(ordersQuery);
  const [cropFilter, setCropFilter] = useState("all");

  const addExpense = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fd = new FormData(form);
      if (!uid) throw new Error("not signed in");
      const { error } = await supabase.from("farm_expenses").insert({
        farmer_id: uid,
        crop: String(fd.get("crop") ?? "").trim() || "Crop",
        category: String(fd.get("category") ?? "other"),
        amount: Number(fd.get("amount")),
        spent_on: String(fd.get("spent_on") ?? "") || new Date().toISOString().slice(0, 10),
        acres: fd.get("acres") ? Number(fd.get("acres")) : null,
        notes: String(fd.get("notes") ?? "").trim() || null,
      });
      if (error) throw error;
      form.reset();
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "खर्च जुड़ गया" : "Expense added");
      qc.invalidateQueries({ queryKey: ["farm_expenses"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the expense"),
  });

  const removeExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("farm_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farm_expenses"] }),
  });

  const all = expenses.data ?? [];
  const crops = [...new Set(all.map((e) => e.crop))];
  const rows = cropFilter === "all" ? all : all.filter((e) => e.crop === cropFilter);
  const totalCost = rows.reduce((s, e) => s + Number(e.amount), 0);

  // Revenue from my paid/delivered sales (farmer side)
  const sold = (orders.data ?? []).filter(
    (o) => o.farmer_id === uid && ["delivered", "paid"].includes(o.status),
  );
  const soldFor = (crop: string | null) =>
    sold.filter((o) => !crop || o.crop === crop).reduce((s, o) => s + Number(o.total_amount), 0);
  const soldValue = soldFor(cropFilter === "all" ? null : cropFilter);

  const acresTotal = (() => {
    const explicit = rows.reduce((s, e) => s + (Number(e.acres) || 0), 0);
    return explicit > 0 ? explicit : null;
  })();

  const profit = soldValue - totalCost;
  const catLabel = (id: string) =>
    CATEGORIES.find((c) => c.id === id)?.[lang === "hi" ? "hi" : "en"] ?? id;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("expenses")}</h1>
          <p className="text-muted-foreground">{t("expensesHint")}</p>
        </div>
        {rows.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                "sasyavedix-expenses.csv",
                ["Crop", "Category", "Amount (INR)", "Date", "Acres", "Notes"],
                rows.map((e) => [e.crop, catLabel(e.category), e.amount, e.spent_on, e.acres, e.notes]),
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            {t("downloadCSV")}
          </Button>
        )}
      </header>

      <section className="glass-card rounded-3xl p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <ReceiptIndianRupee className="h-5 w-5 text-primary" />
          {t("addExpense")}
        </h2>
        <form
          className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            addExpense.mutate(e.currentTarget);
          }}
        >
          <div>
            <Label htmlFor="crop">{t("crop")}</Label>
            <Input id="crop" name="crop" required placeholder="Wheat" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="category">{t("category")}</Label>
            <select
              id="category"
              name="category"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "hi" ? c.hi : c.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="amount">{t("amount")} (₹)</Label>
            <Input id="amount" name="amount" type="number" min="1" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="spent_on">{t("spentOn")}</Label>
            <Input
              id="spent_on"
              name="spent_on"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="acres">{t("area")}</Label>
            <Input id="acres" name="acres" type="number" step="0.1" min="0" className="mt-1" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={addExpense.isPending}>
              {addExpense.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("addExpense")}
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-3xl p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <IndianRupee className="h-4 w-4" /> {t("totalCost")}
          </p>
          <p className="mt-1 font-display text-3xl font-bold">
            ₹{totalCost.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="glass-card rounded-3xl p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wheat className="h-4 w-4" /> {t("soldValue")}
          </p>
          <p className="mt-1 font-display text-3xl font-bold">
            ₹{soldValue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="glass-card rounded-3xl p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> {t("profit")}
          </p>
          <p
            className={`mt-1 font-display text-3xl font-bold ${
              profit >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {profit < 0 ? "−" : ""}₹{Math.abs(profit).toLocaleString("en-IN")}
          </p>
          {acresTotal && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("profitPerAcre")}: ₹
              {Math.round(profit / acresTotal).toLocaleString("en-IN")} · {acresTotal}{" "}
              {lang === "hi" ? "एकड़" : "acres"}
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">
            {lang === "hi" ? "खर्चों की सूची" : "Expense list"}
          </h2>
          {crops.length > 1 && (
            <select
              aria-label="filter by crop"
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
            >
              <option value="all">{lang === "hi" ? "सभी फसलें" : "All crops"}</option>
              {crops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
        {expenses.isLoading ? (
          <Skeleton className="h-28 w-full rounded-3xl" />
        ) : rows.length === 0 ? (
          <p className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">
            {t("noExpenses")}
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((e: FarmExpense) => (
              <li
                key={e.id}
                className="glass-card flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {e.crop} · {catLabel(e.category)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(`${e.spent_on}T00:00:00`).toLocaleDateString("en-IN")}
                    {e.acres ? ` · ${e.acres} ${lang === "hi" ? "एकड़" : "acres"}` : ""}
                    {e.notes ? ` · ${e.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-bold">
                    ₹{Number(e.amount).toLocaleString("en-IN")}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="delete expense"
                    onClick={() => removeExpense.mutate(e.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

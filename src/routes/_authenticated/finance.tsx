import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, ShieldCheck, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { insuranceQuery, loansQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Loans & Insurance — SasyaVediX" },
      { name: "description", content: "Track Kisan Credit Card, farm loans and PMFBY crop insurance in one place." },
      { property: "og:title", content: "Loans & Insurance — SasyaVediX" },
      { property: "og:description", content: "Track Kisan Credit Card, farm loans and crop insurance." },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const loans = useQuery(loansQuery);
  const insurance = useQuery(insuranceQuery);
  const uid = user?.id ?? null;

  const addLoan = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      if (!uid) throw new Error("Not signed in");
      const fd = new FormData(form);
      const { error } = await supabase.from("loans").insert({
        farmer_id: uid,
        kind: String(fd.get("kind") ?? "kcc"),
        bank: String(fd.get("bank") ?? "").trim() || null,
        sanctioned: fd.get("sanctioned") ? Number(fd.get("sanctioned")) : null,
        outstanding: fd.get("outstanding") ? Number(fd.get("outstanding")) : null,
        interest_pct: fd.get("interest_pct") ? Number(fd.get("interest_pct")) : null,
        due_date: String(fd.get("due_date") ?? "") || null,
      });
      if (error) throw error;
      form.reset();
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "ऋण जुड़ गया!" : "Loan added!");
      qc.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["loans"] }),
    onError: (e) => toast.error(e.message),
  });

  const addPolicy = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      if (!uid) throw new Error("Not signed in");
      const fd = new FormData(form);
      const { error } = await supabase.from("insurance_policies").insert({
        farmer_id: uid,
        crop: String(fd.get("crop")).trim(),
        season: String(fd.get("season") ?? "Kharif"),
        area_acres: fd.get("area_acres") ? Number(fd.get("area_acres")) : null,
        sum_insured: fd.get("sum_insured") ? Number(fd.get("sum_insured")) : null,
        premium: fd.get("premium") ? Number(fd.get("premium")) : null,
        insurer: String(fd.get("insurer") ?? "").trim() || null,
      });
      if (error) throw error;
      form.reset();
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "बीमा जुड़ गया!" : "Policy added!");
      qc.invalidateQueries({ queryKey: ["insurance_policies"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const setPolicyStatus = useMutation({
    mutationFn: async ({ id, status, claim_note }: { id: string; status: string; claim_note?: string }) => {
      const { error } = await supabase
        .from("insurance_policies")
        .update({ status, claim_note: claim_note ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance_policies"] }),
    onError: (e) => toast.error(e.message),
  });

  const deletePolicy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insurance_policies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insurance_policies"] }),
    onError: (e) => toast.error(e.message),
  });

  const totalOutstanding = (loans.data ?? []).reduce((s, l) => s + Number(l.outstanding ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("finance")}</h1>
        <p className="text-muted-foreground">{t("financeHint")}</p>
      </header>

      {/* Loans */}
      <section className="glass-card rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Landmark className="h-5 w-5 text-primary" /> {t("loans")}
          </h2>
          <p className="text-sm font-semibold">
            {t("totalOutstanding")}: ₹{totalOutstanding.toLocaleString("en-IN")}
          </p>
        </div>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            addLoan.mutate(e.currentTarget);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="kind">{t("type")}</Label>
            <select id="kind" name="kind" className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm">
              <option value="kcc">Kisan Credit Card</option>
              <option value="term">{lang === "hi" ? "सामान्य ऋण" : "Term loan"}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank">{t("bank")}</Label>
            <Input id="bank" name="bank" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sanctioned">{t("sanctioned")} (₹)</Label>
            <Input id="sanctioned" name="sanctioned" type="number" min="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="outstanding">{t("outstanding")} (₹)</Label>
            <Input id="outstanding" name="outstanding" type="number" min="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interest_pct">{t("interest")} (%)</Label>
            <Input id="interest_pct" name="interest_pct" type="number" min="0" step="0.01" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due_date">{t("dueDate")}</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>
          <div className="sm:col-span-3 lg:col-span-6">
            <Button type="submit" disabled={addLoan.isPending}>
              {addLoan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("addLoan")}
            </Button>
          </div>
        </form>

        {loans.isLoading ? (
          <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
        ) : (loans.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("noLoans")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {(loans.data ?? []).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3">
                <p className="font-semibold">
                  {l.kind === "kcc" ? "Kisan Credit Card" : lang === "hi" ? "सामान्य ऋण" : "Term loan"}
                  {l.bank ? ` · ${l.bank}` : ""}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    {t("outstanding")}: <span className="font-semibold text-foreground">₹{Number(l.outstanding ?? 0).toLocaleString("en-IN")}</span>
                  </span>
                  {l.interest_pct != null && <span>{Number(l.interest_pct)}%</span>}
                  {l.due_date && (
                    <span>
                      {t("dueDate")}: {l.due_date}
                    </span>
                  )}
                  <button onClick={() => deleteLoan.mutate(l.id)} aria-label={t("delete")} className="transition-colors hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Insurance */}
      <section className="glass-card rounded-3xl p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> {t("insurance")}
        </h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6"
          onSubmit={(e) => {
            e.preventDefault();
            addPolicy.mutate(e.currentTarget);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="crop">{t("crop")}</Label>
            <Input id="crop" name="crop" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="season">{t("season")}</Label>
            <select id="season" name="season" className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm">
              <option>Kharif</option>
              <option>Rabi</option>
              <option>Zaid</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="area_acres">{t("area")}</Label>
            <Input id="area_acres" name="area_acres" type="number" min="0" step="0.1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sum_insured">{t("sumInsured")} (₹)</Label>
            <Input id="sum_insured" name="sum_insured" type="number" min="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="premium">{t("premium")} (₹)</Label>
            <Input id="premium" name="premium" type="number" min="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="insurer">{t("insurer")}</Label>
            <Input id="insurer" name="insurer" placeholder={lang === "hi" ? "जैसे — PMFBY / SBI General" : "e.g. PMFBY / SBI General"} />
          </div>
          <div className="sm:col-span-3 lg:col-span-6">
            <Button type="submit" disabled={addPolicy.isPending}>
              {addPolicy.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("addPolicy")}
            </Button>
          </div>
        </form>

        {insurance.isLoading ? (
          <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
        ) : (insurance.data ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("noPolicies")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {(insurance.data ?? []).map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {p.crop} · {p.season}
                    {p.insurer ? ` · ${p.insurer}` : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.status}
                      onChange={(e) => setPolicyStatus.mutate({ id: p.id, status: e.target.value })}
                      className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
                      aria-label={t("status")}
                    >
                      <option value="enrolled">{t("enrolled")}</option>
                      <option value="claim_filed">{t("claimFiled")}</option>
                      <option value="paid">{t("claimPaid")}</option>
                    </select>
                    <button onClick={() => deletePolicy.mutate(p.id)} aria-label={t("delete")} className="text-muted-foreground transition-colors hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.area_acres != null && `${p.area_acres} acres · `}
                  {p.sum_insured != null && `${t("sumInsured")} ₹${Number(p.sum_insured).toLocaleString("en-IN")} · `}
                  {p.premium != null && `${t("premium")} ₹${Number(p.premium).toLocaleString("en-IN")}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

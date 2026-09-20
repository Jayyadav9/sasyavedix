import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Boxes, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import {
  groupMembersQuery,
  groupPoolsQuery,
  groupsQuery,
  marketPricesQuery,
  poolContributionsQuery,
  latestByCropMandi,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/groups")({
  head: () => ({
    meta: [
      { title: "Farmer Groups — SasyaVediX" },
      { name: "description", content: "Pool produce with nearby farmers and sell in bulk at better mandi prices." },
      { property: "og:title", content: "Farmer Groups — SasyaVediX" },
      { property: "og:description", content: "Pool produce with nearby farmers and sell in bulk." },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const { auth } = useAuth();
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const groups = useQuery(groupsQuery);
  const members = useQuery(groupMembersQuery);
  const pools = useQuery(groupPoolsQuery);
  const contribs = useQuery(poolContributionsQuery);
  const prices = useQuery(marketPricesQuery);
  const [qtyFor, setQtyFor] = useState<string | null>(null);

  const uid = auth.status === "authenticated" ? auth.user.id : null;
  const myGroups = (groups.data ?? []).filter(
    (g) => g.created_by === uid || (members.data ?? []).some((m) => m.group_id === g.id && m.farmer_id === uid),
  );

  const createGroup = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      if (!uid) throw new Error("Not signed in");
      const fd = new FormData(form);
      const { data: g, error } = await supabase
        .from("farmer_groups")
        .insert({
          name: String(fd.get("name")).trim(),
          village: String(fd.get("village") ?? "").trim() || null,
          district: String(fd.get("district") ?? "").trim() || null,
          created_by: uid,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: me } = await supabase
        .from("group_members")
        .insert({ group_id: g.id, farmer_id: uid });
      if (me) throw me;
      form.reset();
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "समूह बन गया!" : "Group created!");
      qc.invalidateQueries({ queryKey: ["farmer_groups"] });
      qc.invalidateQueries({ queryKey: ["group_members"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const createPool = useMutation({
    mutationFn: async ({ groupId, form }: { groupId: string; form: HTMLFormElement }) => {
      if (!uid) throw new Error("Not signed in");
      const fd = new FormData(form);
      const { error } = await supabase.from("group_pools").insert({
        group_id: groupId,
        crop: String(fd.get("crop")).trim(),
        variety: String(fd.get("variety") ?? "").trim() || null,
        expected_price: fd.get("expected_price") ? Number(fd.get("expected_price")) : null,
        created_by: uid,
      });
      if (error) throw error;
      form.reset();
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "पूल बन गया!" : "Pool created!");
      qc.invalidateQueries({ queryKey: ["group_pools"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const contribute = useMutation({
    mutationFn: async ({ poolId, quantity }: { poolId: string; quantity: number }) => {
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase
        .from("pool_contributions")
        .upsert({ pool_id: poolId, farmer_id: uid, quantity }, { onConflict: "pool_id,farmer_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "मात्रा जुड़ गई!" : "Quantity added!");
      qc.invalidateQueries({ queryKey: ["pool_contributions"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePool = useMutation({
    mutationFn: async (poolId: string) => {
      const { error } = await supabase.from("group_pools").delete().eq("id", poolId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group_pools"] }),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("groups")}</h1>
        <p className="text-muted-foreground">{t("groupsHint")}</p>
      </header>

      <section className="glass-card rounded-3xl p-5">
        <h2 className="font-display text-lg font-semibold">{t("createGroup")}</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            createGroup.mutate(e.currentTarget);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("groupName")}</Label>
            <Input id="name" name="name" required placeholder={lang === "hi" ? "जैसे — सहकारी किसान समूह" : "e.g. Sahkari Kisan Group"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="village">{t("village")}</Label>
            <Input id="village" name="village" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">{t("district")}</Label>
            <Input id="district" name="district" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={createGroup.isPending}>
              {createGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createGroup")}
            </Button>
          </div>
        </form>
      </section>

      {groups.isLoading ? (
        <Skeleton className="h-48 w-full rounded-3xl" />
      ) : myGroups.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center text-muted-foreground">{t("noGroups")}</div>
      ) : (
        myGroups.map((g) => {
          const memberCount = (members.data ?? []).filter((m) => m.group_id === g.id).length;
          const gPools = (pools.data ?? []).filter((p) => p.group_id === g.id);
          return (
            <section key={g.id} className="glass-card rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-field text-primary-foreground">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold">{g.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {[g.village, g.district].filter(Boolean).join(", ")} · {memberCount}{" "}
                      {lang === "hi" ? "सदस्य" : "members"}
                    </p>
                  </div>
                </div>
              </div>

              <form
                className="mt-4 grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  createPool.mutate({ groupId: g.id, form: e.currentTarget });
                }}
              >
                <Input name="crop" required placeholder={t("crop")} aria-label={t("crop")} />
                <Input name="variety" placeholder={t("variety")} aria-label={t("variety")} />
                <Input name="expected_price" type="number" min="0" placeholder={t("expectedPrice")} aria-label={t("expectedPrice")} />
                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full" variant="outline" disabled={createPool.isPending}>
                    <Boxes className="mr-2 h-4 w-4" /> {t("newPool")}
                  </Button>
                </div>
              </form>

              {gPools.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {gPools.map((p) => {
                    const pcs = (contribs.data ?? []).filter((c) => c.pool_id === p.id);
                    const total = pcs.reduce((s, c) => s + Number(c.quantity), 0);
                    const best = latestByCropMandi(prices.data ?? []).find((r) => r.crop === p.crop);
                    return (
                      <li key={p.id} className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-display font-bold">
                            {p.crop}
                            {p.variety ? ` · ${p.variety}` : ""} — {total.toLocaleString("en-IN")} {t("quintal")}
                          </p>
                          <div className="flex items-center gap-2">
                            {best && (
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                {t("bestMandi")}: ₹{Number(best.price).toLocaleString("en-IN")} · {best.market}
                              </span>
                            )}
                            {p.created_by === uid && (
                              <button
                                onClick={() => deletePool.mutate(p.id)}
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                aria-label={t("delete")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pcs.length} {lang === "hi" ? "किसानों का योगदान" : "farmers contributing"}
                          {p.expected_price ? ` · ${t("expectedPrice")} ₹${Number(p.expected_price).toLocaleString("en-IN")}` : ""}
                        </p>
                        {qtyFor === p.id ? (
                          <form
                            className="mt-3 flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const q = Number(new FormData(e.currentTarget).get("quantity"));
                              if (q > 0) {
                                contribute.mutate({ poolId: p.id, quantity: q });
                                setQtyFor(null);
                              }
                            }}
                          >
                            <Input name="quantity" type="number" min="0.1" step="0.1" required placeholder={t("quantityQuintal")} className="max-w-44" />
                            <Button type="submit" size="sm" disabled={contribute.isPending}>
                              {t("addMyQuantity")}
                            </Button>
                          </form>
                        ) : (
                          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setQtyFor(p.id)}>
                            {t("addMyQuantity")}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { latestByCropMandi, marketPricesQuery, myListingsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Crop — SasyaVediX" },
      {
        name: "description",
        content: "List your harvest for sale with quantity, quality and expected price.",
      },
      { property: "og:title", content: "Sell Your Crop — SasyaVediX" },
      { property: "og:description", content: "List your harvest and track buyer-ready listings." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const listings = useQuery(myListingsQuery);
  const prices = useQuery(marketPricesQuery);

  const [form, setForm] = useState({
    crop: "",
    variety: "",
    quantity: "",
    expected_price: "",
    location: "",
    harvest_date: "",
    quality_grade: "A",
    notes: "",
  });

  const cropOptions = [...new Set((prices.data ?? []).map((p) => p.crop))];
  const suggested = form.crop
    ? latestByCropMandi(prices.data ?? [])
        .filter((p) => p.crop === form.crop)
        .sort((a, b) => b.price - a.price)[0]
    : undefined;

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("crop_listings").insert({
        farmer_id: auth.user.id,
        crop: form.crop,
        variety: form.variety || null,
        quantity: Number(form.quantity),
        expected_price: form.expected_price ? Number(form.expected_price) : null,
        location: form.location,
        harvest_date: form.harvest_date || null,
        quality_grade: form.quality_grade,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("listingCreated"));
      setForm({
        crop: "",
        variety: "",
        quantity: "",
        expected_price: "",
        location: "",
        harvest_date: "",
        quality_grade: "A",
        notes: "",
      });
      qc.invalidateQueries({ queryKey: ["crop_listings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save listing"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crop_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop_listings"] }),
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-5">
      <section className="glass-card rounded-3xl p-6 lg:col-span-3">
        <h1 className="font-display text-2xl font-bold">{t("sellCrop")}</h1>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="crop">{t("crop")}</Label>
              <select
                id="crop"
                required
                value={form.crop}
                onChange={(e) => setForm({ ...form, crop: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="">—</option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="variety">{t("variety")}</Label>
              <Input
                id="variety"
                value={form.variety}
                onChange={(e) => setForm({ ...form, variety: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">{t("quantity")} (quintal)</Label>
              <Input
                id="quantity"
                type="number"
                min="0.1"
                step="0.1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">{t("expectedPrice")}</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={form.expected_price}
                onChange={(e) => setForm({ ...form, expected_price: e.target.value })}
              />
              {suggested && (
                <p className="text-xs text-muted-foreground">
                  {t("bestPrice")}: ₹{Number(suggested.price).toLocaleString("en-IN")} ·{" "}
                  {suggested.market}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">{t("location")}</Label>
              <Input
                id="location"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="harvest">{t("harvestDate")}</Label>
              <Input
                id="harvest"
                type="date"
                value={form.harvest_date}
                onChange={(e) => setForm({ ...form, harvest_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">{t("quality")}</Label>
              <select
                id="grade"
                value={form.quality_grade}
                onChange={(e) => setForm({ ...form, quality_grade: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {["A", "B", "C"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <Button type="submit" size="lg" disabled={create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submitListing")}
          </Button>
        </form>
      </section>

      <section className="lg:col-span-2">
        <h2 className="mb-3 font-display text-xl font-bold">{t("myListings")}</h2>
        {listings.isLoading ? (
          <Skeleton className="h-40 w-full rounded-3xl" />
        ) : (listings.data ?? []).length === 0 ? (
          <p className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">
            {t("noResults")}
          </p>
        ) : (
          <ul className="space-y-3">
            {(listings.data ?? []).map((l) => (
              <li key={l.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {l.crop}
                      {l.variety ? ` · ${l.variety}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {l.quantity} {l.unit} · {l.location} · Grade {l.quality_grade}
                    </p>
                    {l.expected_price && (
                      <p className="mt-1 font-display font-bold text-primary">
                        ₹{Number(l.expected_price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove.mutate(l.id)}
                    aria-label="Delete listing"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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

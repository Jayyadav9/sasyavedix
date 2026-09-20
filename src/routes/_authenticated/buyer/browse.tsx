import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ImageIcon, Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { browseListingsQuery, latestByCropMandi, marketPricesQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/buyer/browse")({
  head: () => ({
    meta: [
      { title: "Browse Crops — SasyaVediX Buyer Portal" },
      {
        name: "description",
        content:
          "Browse farmer crop listings with photos, quality grade and live mandi prices, then send an offer.",
      },
      { property: "og:title", content: "Browse Crops — SasyaVediX Buyer Portal" },
      {
        property: "og:description",
        content: "Buy directly from farmers with live mandi price reference.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowsePage,
});

type Listing = {
  id: string;
  farmer_id: string;
  crop: string;
  variety: string | null;
  quantity: number;
  unit: string;
  expected_price: number | null;
  location: string;
  quality_grade: string | null;
  harvest_date: string | null;
  image_url: string | null;
  notes: string | null;
};

function ListingPhoto({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!path) return;
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    supabase.storage
      .from("crop-images")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  if (!url) {
    return (
      <div className="grid h-40 w-full place-items-center rounded-2xl bg-muted text-muted-foreground">
        <ImageIcon className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="Crop offered for sale"
      className="h-40 w-full rounded-2xl object-cover"
      loading="lazy"
    />
  );
}

function BrowsePage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const listings = useQuery(browseListingsQuery);
  const prices = useQuery(marketPricesQuery);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ price: "", quantity: "", message: "" });

  const latest = latestByCropMandi(prices.data ?? []);
  const mandiFor = (crop: string) =>
    latest.filter((p) => p.crop === crop).sort((a, b) => b.price - a.price)[0];

  const rows = ((listings.data ?? []) as Listing[]).filter((l) =>
    `${l.crop} ${l.variety ?? ""} ${l.location}`.toLowerCase().includes(q.toLowerCase()),
  );

  const sendOffer = useMutation({
    mutationFn: async (listing: Listing) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const { error } = await supabase.from("offers").insert({
        listing_id: listing.id,
        buyer_id: auth.user.id,
        farmer_id: listing.farmer_id,
        price_per_quintal: Number(form.price),
        quantity: Number(form.quantity),
        message: form.message || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("offerSent"));
      setOpenId(null);
      setForm({ price: "", quantity: "", message: "" });
      qc.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send offer"),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("browseCrops")}</h1>
          <p className="text-muted-foreground">
            Fresh harvests listed by farmers, with today&apos;s mandi price for reference.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </header>

      {listings.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="glass-card rounded-3xl p-8 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((l) => {
            const mandi = mandiFor(l.crop);
            return (
              <article key={l.id} className="glass-card lift-hover space-y-3 rounded-3xl p-4">
                <ListingPhoto path={l.image_url} />
                <div>
                  <h2 className="font-display text-lg font-bold">
                    {l.crop}
                    {l.variety ? ` · ${l.variety}` : ""}
                  </h2>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {l.location} · {l.quantity} {l.unit} · Grade {l.quality_grade ?? "A"}
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("expectedPrice")}</p>
                    <p className="font-display text-xl font-bold text-primary">
                      {l.expected_price
                        ? `₹${Number(l.expected_price).toLocaleString("en-IN")}`
                        : "—"}
                    </p>
                  </div>
                  {mandi && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{mandi.market}</p>
                      <p className="text-sm font-semibold">
                        ₹{Number(mandi.price).toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}
                </div>
                {l.notes && <p className="text-sm text-muted-foreground">{l.notes}</p>}

                {openId === l.id ? (
                  <form
                    className="space-y-3 rounded-2xl bg-muted/50 p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendOffer.mutate(l);
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`p-${l.id}`}>{t("offerPrice")}</Label>
                      <Input
                        id={`p-${l.id}`}
                        type="number"
                        min="1"
                        required
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`q-${l.id}`}>{t("offerQty")}</Label>
                      <Input
                        id={`q-${l.id}`}
                        type="number"
                        min="0.1"
                        step="0.1"
                        max={l.quantity}
                        required
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      />
                    </div>
                    <Textarea
                      placeholder={t("notes")}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={sendOffer.isPending}>
                        {sendOffer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("sendOffer")}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setOpenId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setOpenId(l.id);
                      setForm({
                        price: l.expected_price ? String(l.expected_price) : "",
                        quantity: String(l.quantity),
                        message: "",
                      });
                    }}
                  >
                    {t("makeOffer")}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

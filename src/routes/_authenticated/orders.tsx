import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Handshake, IndianRupee, Loader2, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { offersQuery, ordersQuery, type Order } from "@/lib/queries";
import { OrderTrack } from "@/components/order-track";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Offers & Orders — SasyaVediX" },
      {
        name: "description",
        content:
          "Accept buyer offers, dispatch your crop, confirm delivery and track payment for every sale.",
      },
      { property: "og:title", content: "Offers & Orders — SasyaVediX" },
      {
        property: "og:description",
        content: "Track every crop sale from buyer offer to payment received.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

type OfferRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  farmer_id: string;
  price_per_quintal: number;
  quantity: number;
  message: string | null;
  status: string;
  created_at: string;
  crop_listings: {
    crop: string;
    variety: string | null;
    location: string | null;
    quantity: number;
    expected_price: number | null;
    image_url: string | null;
  } | null;
};

function OrdersPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const offers = useQuery(offersQuery);
  const orders = useQuery(ordersQuery);

  const pending = ((offers.data ?? []) as OfferRow[]).filter((o) => o.status === "pending");

  const respond = useMutation({
    mutationFn: async ({ offer, accept }: { offer: OfferRow; accept: boolean }) => {
      if (!accept) {
        const { error } = await supabase
          .from("offers")
          .update({ status: "rejected" })
          .eq("id", offer.id);
        if (error) throw error;
        return;
      }
      const { error: upErr } = await supabase
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", offer.id);
      if (upErr) throw upErr;

      const { error: orderErr } = await supabase.from("orders").insert({
        listing_id: offer.listing_id,
        offer_id: offer.id,
        farmer_id: offer.farmer_id,
        buyer_id: offer.buyer_id,
        crop: offer.crop_listings?.crop ?? "Crop",
        variety: offer.crop_listings?.variety ?? null,
        quantity: offer.quantity,
        price_per_quintal: offer.price_per_quintal,
        total_amount: offer.quantity * offer.price_per_quintal,
        pickup_location: offer.crop_listings?.location ?? null,
        status: "accepted",
      });
      if (orderErr) throw orderErr;

      await supabase.from("crop_listings").update({ status: "sold" }).eq("id", offer.listing_id);
    },
    onSuccess: (_d, v) => {
      toast.success(v.accept ? "Offer accepted — order created" : "Offer rejected");
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["crop_listings"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update offer"),
  });

  const advance = useMutation({
    mutationFn: async ({ order, status }: { order: Order; status: string }) => {
      const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === "delivered") patch['delivery_date'] = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update order"),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("orders")}</h1>
        <p className="text-muted-foreground">
          Accept offers, dispatch your crop and track payment.
        </p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <Handshake className="h-5 w-5 text-primary" />
          {t("incomingOffers")}
        </h2>
        {offers.isLoading ? (
          <Skeleton className="h-28 w-full rounded-3xl" />
        ) : pending.length === 0 ? (
          <p className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">{t("noOffers")}</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((o) => (
              <li key={o.id} className="glass-card rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {o.crop_listings?.crop}
                      {o.crop_listings?.variety ? ` · ${o.crop_listings.variety}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {o.quantity} quintal · {o.crop_listings?.location}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-primary">
                      ₹{Number(o.price_per_quintal).toLocaleString("en-IN")}/quintal ·{" "}
                      {t("total")} ₹
                      {(o.quantity * o.price_per_quintal).toLocaleString("en-IN")}
                    </p>
                    {o.message && <p className="mt-1 text-sm">“{o.message}”</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => respond.mutate({ offer: o, accept: true })}
                      disabled={respond.isPending}
                    >
                      {respond.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("accept")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => respond.mutate({ offer: o, accept: false })}
                      disabled={respond.isPending}
                    >
                      {t("reject")}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <PackageCheck className="h-5 w-5 text-primary" />
          {t("orders")}
        </h2>
        {orders.isLoading ? (
          <Skeleton className="h-28 w-full rounded-3xl" />
        ) : (orders.data ?? []).length === 0 ? (
          <p className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">{t("noOrders")}</p>
        ) : (
          <ul className="space-y-3">
            {(orders.data ?? []).map((o) => (
              <li key={o.id} className="glass-card space-y-3 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {o.crop}
                      {o.variety ? ` · ${o.variety}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {o.quantity} quintal · ₹
                      {Number(o.price_per_quintal).toLocaleString("en-IN")}/quintal
                    </p>
                  </div>
                  <p className="flex items-center font-display text-xl font-bold text-primary">
                    <IndianRupee className="h-4 w-4" />
                    {Number(o.total_amount).toLocaleString("en-IN")}
                  </p>
                </div>

                <OrderTrack status={o.status} />

                <div className="flex flex-wrap gap-2">
                  {o.status === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() => advance.mutate({ order: o, status: "dispatched" })}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      {t("markDispatched")}
                    </Button>
                  )}
                  {o.status === "dispatched" && (
                    <Button
                      size="sm"
                      onClick={() => advance.mutate({ order: o, status: "delivered" })}
                    >
                      <PackageCheck className="mr-2 h-4 w-4" />
                      {t("markDelivered")}
                    </Button>
                  )}
                  {o.status === "delivered" && (
                    <Button
                      size="sm"
                      onClick={() => advance.mutate({ order: o, status: "paid" })}
                    >
                      <IndianRupee className="mr-2 h-4 w-4" />
                      {t("markPaid")}
                    </Button>
                  )}
                  {o.status !== "paid" && o.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => advance.mutate({ order: o, status: "cancelled" })}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

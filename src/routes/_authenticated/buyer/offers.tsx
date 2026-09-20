import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Handshake, IndianRupee, PackageCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { offersQuery, ordersQuery, paymentsQuery, type Order } from "@/lib/queries";
import { OrderTrack } from "@/components/order-track";
import { Invoice } from "@/components/invoice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/buyer/offers")({
  head: () => ({
    meta: [
      { title: "My Offers & Orders — SasyaVediX Buyer Portal" },
      {
        name: "description",
        content: "Track the offers you sent to farmers and follow each order through to payment.",
      },
      { property: "og:title", content: "My Offers & Orders — SasyaVediX" },
      {
        property: "og:description",
        content: "Follow your crop purchases from offer to delivery and payment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuyerOffersPage,
});

type OfferRow = {
  id: string;
  status: string;
  quantity: number;
  price_per_quintal: number;
  created_at: string;
  crop_listings: { crop: string; variety: string | null; location: string | null } | null;
};

function BuyerOffersPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const offers = useQuery(offersQuery);
  const orders = useQuery(ordersQuery);
  const payments = useQuery(paymentsQuery);
  const [invoiceFor, setInvoiceFor] = useState<{
    order: Order;
    seller: string | null;
    place: string | null;
  } | null>(null);

  // Buyers may read the profile of a farmer they share an order with (RLS).
  const viewInvoice = async (order: Order) => {
    if (invoiceFor?.order.id === order.id) {
      setInvoiceFor(null);
      return;
    }
    const { data: seller } = await supabase
      .from("profiles")
      .select("full_name, village, district")
      .eq("id", order.farmer_id)
      .maybeSingle();
    setInvoiceFor({
      order,
      seller: seller?.full_name ?? null,
      place: [seller?.village, seller?.district].filter(Boolean).join(", ") || null,
    });
  };

  const confirm = useMutation({
    mutationFn: async ({ order, status }: { order: Order; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update order"),
  });

  const myOrders = orders.data ?? [];
  const activeOrders = myOrders.filter((o) => o.status !== "cancelled");
  const totalSpent = activeOrders
    .filter((o) => o.status === "delivered" || o.status === "paid")
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const byCrop = new Map<string, number>();
  for (const o of activeOrders) byCrop.set(o.crop, (byCrop.get(o.crop) ?? 0) + Number(o.total_amount));
  const topCrops = [...byCrop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("myOffers")}</h1>
        <p className="text-muted-foreground">Your offers to farmers and the orders they became.</p>
      </header>

      {activeOrders.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="glass-card rounded-3xl p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PackageCheck className="h-4 w-4" />
              {t("ordersPlaced")}
            </p>
            <p className="mt-1 font-display text-3xl font-bold">{activeOrders.length}</p>
          </div>
          <div className="glass-card rounded-3xl p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              {t("totalSpent")}
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-primary">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="glass-card rounded-3xl p-5">
            <p className="text-sm text-muted-foreground">{t("purchasesByCrop")}</p>
            <ul className="mt-1 space-y-1 text-sm font-semibold">
              {topCrops.map(([crop, amt]) => (
                <li key={crop} className="flex justify-between gap-2">
                  <span>{crop}</span>
                  <span className="text-primary">₹{Math.round(amt).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <Handshake className="h-5 w-5 text-primary" />
          {t("offers")}
        </h2>
        {offers.isLoading ? (
          <Skeleton className="h-24 w-full rounded-3xl" />
        ) : (offers.data ?? []).length === 0 ? (
          <p className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">{t("noOffers")}</p>
        ) : (
          <ul className="space-y-3">
            {((offers.data ?? []) as OfferRow[]).map((o) => (
              <li
                key={o.id}
                className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
              >
                <div>
                  <p className="font-semibold">
                    {o.crop_listings?.crop}
                    {o.crop_listings?.variety ? ` · ${o.crop_listings.variety}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {o.quantity} quintal · ₹
                    {Number(o.price_per_quintal).toLocaleString("en-IN")}/quintal ·{" "}
                    {o.crop_listings?.location}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    o.status === "accepted"
                      ? "bg-primary/15 text-primary"
                      : o.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {o.status}
                </span>
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
          <Skeleton className="h-24 w-full rounded-3xl" />
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
                      {o.quantity} quintal · {o.pickup_location ?? "—"}
                    </p>
                  </div>
                  <p className="flex items-center font-display text-xl font-bold text-primary">
                    <IndianRupee className="h-4 w-4" />
                    {Number(o.total_amount).toLocaleString("en-IN")}
                  </p>
                </div>
                <OrderTrack status={o.status} />
                {o.status === "dispatched" && (
                  <Button size="sm" onClick={() => confirm.mutate({ order: o, status: "delivered" })}>
                    {t("markDelivered")}
                  </Button>
                )}
                {o.status === "delivered" && (
                  <Button size="sm" onClick={() => confirm.mutate({ order: o, status: "paid" })}>
                    <IndianRupee className="mr-2 h-4 w-4" />
                    {t("markPaid")}
                  </Button>
                )}
                {["dispatched", "delivered", "paid"].includes(o.status) && (
                  <Button size="sm" variant="outline" onClick={() => void viewInvoice(o)}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t("viewInvoice")}
                  </Button>
                )}
                {invoiceFor?.order.id === o.id && (
                  <Invoice
                    order={o}
                    payments={(payments.data ?? []).filter((p) => p.order_id === o.id)}
                    sellerName={invoiceFor.seller}
                    sellerPlace={invoiceFor.place}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

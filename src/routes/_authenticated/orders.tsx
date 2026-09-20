import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, Handshake, IndianRupee, Loader2, MessageCircle, PackageCheck, Send, Star, Truck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import {
  offersQuery,
  ordersQuery,
  paymentsQuery,
  profileQuery,
  reviewsQuery,
  orderMessagesQuery,
  type Order,
} from "@/lib/queries";
import { OrderTrack } from "@/components/order-track";
import { Invoice } from "@/components/invoice";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const { t, lang } = useLang();
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const qc = useQueryClient();
  const offers = useQuery(offersQuery);
  const orders = useQuery(ordersQuery);
  const payments = useQuery(paymentsQuery);
  const profile = useQuery(profileQuery);
  const reviews = useQuery(reviewsQuery);
  const [invoiceFor, setInvoiceFor] = useState<string | null>(null);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [rateFor, setRateFor] = useState<string | null>(null);
  const [dispatchFor, setDispatchFor] = useState<string | null>(null);
  const [chatFor, setChatFor] = useState<string | null>(null);
  const [stars, setStars] = useState(5);

  const submitReview = useMutation({
    mutationFn: async ({ order, form }: { order: Order; form: HTMLFormElement }) => {
      if (!uid) throw new Error("not signed in");
      const fd = new FormData(form);
      const ratee = order.farmer_id === uid ? order.buyer_id : order.farmer_id;
      const { error } = await supabase.from("reviews").insert({
        order_id: order.id,
        rater_id: uid,
        ratee_id: ratee,
        rating: stars,
        comment: String(fd.get("comment") ?? "").trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("ratedThanks"));
      setRateFor(null);
      setStars(5);
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save the rating"),
  });

  const pending = ((offers.data ?? []) as OfferRow[]).filter((o) => o.status === "pending");

  const paidFor = (orderId: string) =>
    (payments.data ?? [])
      .filter((p) => p.order_id === orderId)
      .reduce((s, p) => s + Number(p.amount), 0);

  const recordPayment = useMutation({
    mutationFn: async ({ order, form }: { order: Order; form: HTMLFormElement }) => {
      const fd = new FormData(form);
      const amount = Number(fd.get("amount"));
      const { error } = await supabase.from("payments").insert({
        order_id: order.id,
        farmer_id: order.farmer_id,
        buyer_id: order.buyer_id,
        amount,
        method: String(fd.get("method") ?? "upi"),
        reference: String(fd.get("reference") ?? "").trim() || null,
      });
      if (error) throw error;
      if (paidFor(order.id) + amount >= Number(order.total_amount)) {
        await supabase
          .from("orders")
          .update({ status: "paid", payment_method: String(fd.get("method") ?? "upi") })
          .eq("id", order.id);
      }
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "भुगतान दर्ज हुआ" : "Payment recorded");
      setPayFor(null);
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not record the payment"),
  });


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
      const { error } = await supabase
        .from("orders")
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === "delivered"
            ? { delivery_date: new Date().toISOString().slice(0, 10) }
            : {}),
        })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update order"),
  });

  const dispatchOrder = useMutation({
    mutationFn: async ({ order, form }: { order: Order; form: HTMLFormElement }) => {
      const fd = new FormData(form);
      const { error } = await supabase
        .from("orders")
        .update({
          status: "dispatched",
          updated_at: new Date().toISOString(),
          vehicle_no: String(fd.get("vehicle_no") ?? "").trim() || null,
          driver_phone: String(fd.get("driver_phone") ?? "").trim() || null,
        })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "माल भेज दिया गया" : "Marked as dispatched");
      setDispatchFor(null);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update order"),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("orders")}</h1>
          <p className="text-muted-foreground">
            Accept offers, dispatch your crop and track payment.
          </p>
        </div>
        {(orders.data ?? []).length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                "sasyavedix-orders.csv",
                ["Invoice", "Crop", "Variety", "Quantity (quintal)", "Rate (INR/quintal)", "Total (INR)", "Status", "Date"],
                (orders.data ?? []).map((o) => [
                  o.invoice_no,
                  o.crop,
                  o.variety,
                  o.quantity,
                  o.price_per_quintal,
                  o.total_amount,
                  o.status,
                  new Date(o.created_at).toLocaleDateString("en-IN"),
                ]),
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            {t("downloadCSV")}
          </Button>
        )}
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

                {(o.dispatched_on || o.delivered_on || o.vehicle_no) && (
                  <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-2xl bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
                    {o.dispatched_on && (
                      <span>
                        {t("dispatchedOn")}: {new Date(o.dispatched_on).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}
                      </span>
                    )}
                    {o.delivered_on && (
                      <span>
                        {t("deliveredOn")}: {new Date(o.delivered_on).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")}
                      </span>
                    )}
                    {o.vehicle_no && (
                      <span>
                        {t("vehicleNo")}: {o.vehicle_no}
                      </span>
                    )}
                    {o.driver_phone && (
                      <span>
                        {t("driverPhone")}: {o.driver_phone}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {o.status === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() => setDispatchFor(dispatchFor === o.id ? null : o.id)}
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
                  {(o.status === "delivered" || o.status === "dispatched") && (
                    <Button size="sm" onClick={() => setPayFor(payFor === o.id ? null : o.id)}>
                      <IndianRupee className="mr-2 h-4 w-4" />
                      {t("recordPayment")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInvoiceFor(invoiceFor === o.id ? null : o.id)}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {t("viewInvoice")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setChatFor(chatFor === o.id ? null : o.id)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t("chat")}
                  </Button>
                  {["dispatched", "delivered", "paid"].includes(o.status) &&
                    uid &&
                    (() => {
                      const mine = (reviews.data ?? []).find(
                        (r) => r.order_id === o.id && r.rater_id === uid,
                      );
                      return mine ? (
                        <span className="flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-semibold">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          {t("yourRating")}: {mine.rating}/5
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRateFor(rateFor === o.id ? null : o.id)}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {t("rateParty")}
                        </Button>
                      );
                    })()}
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

                {dispatchFor === o.id && (
                  <form
                    className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card/60 p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      dispatchOrder.mutate({ order: o, form: e.currentTarget });
                    }}
                  >
                    <p className="w-full text-sm font-semibold">{t("dispatchDetails")}</p>
                    <div>
                      <Label htmlFor={`v-${o.id}`}>{t("vehicleNo")}</Label>
                      <Input id={`v-${o.id}`} name="vehicle_no" placeholder="MP 09 AB 1234" />
                    </div>
                    <div>
                      <Label htmlFor={`d-${o.id}`}>{t("driverPhone")}</Label>
                      <Input id={`d-${o.id}`} name="driver_phone" placeholder="98765 43210" />
                    </div>
                    <Button type="submit" size="sm" disabled={dispatchOrder.isPending}>
                      <Truck className="mr-2 h-4 w-4" />
                      {t("markDispatched")}
                    </Button>
                  </form>
                )}

                {rateFor === o.id && (
                  <form
                    className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card/60 p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitReview.mutate({ order: o, form: e.currentTarget });
                    }}
                  >
                    <div>
                      <Label>{t("yourRating")}</Label>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-label={`${n} star`}
                            onClick={() => setStars(n)}
                          >
                            <Star
                              className={`h-6 w-6 ${
                                n <= stars ? "fill-accent text-accent" : "text-muted-foreground"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="min-w-48 flex-1">
                      <Label htmlFor={`comment-${o.id}`}>{t("notes")}</Label>
                      <Input id={`comment-${o.id}`} name="comment" className="mt-1" />
                    </div>
                    <Button type="submit" disabled={submitReview.isPending}>
                      {submitReview.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("submitRating")}
                    </Button>
                  </form>
                )}

                {(paidFor(o.id) > 0 || o.status === "paid") && (
                  <p className="text-sm text-muted-foreground">
                    {t("paid")} ₹{paidFor(o.id).toLocaleString("en-IN")} · {t("balance")} ₹
                    {Math.max(Number(o.total_amount) - paidFor(o.id), 0).toLocaleString("en-IN")}
                  </p>
                )}

                {payFor === o.id && (
                  <form
                    className="grid gap-3 rounded-2xl border border-border bg-card/60 p-3 sm:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      recordPayment.mutate({ order: o, form: e.currentTarget });
                    }}
                  >
                    <div>
                      <Label htmlFor={`amount-${o.id}`}>{t("amount")}</Label>
                      <Input
                        id={`amount-${o.id}`}
                        name="amount"
                        type="number"
                        min="1"
                        required
                        defaultValue={Math.max(Number(o.total_amount) - paidFor(o.id), 0)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`method-${o.id}`}>{t("method")}</Label>
                      <select
                        id={`method-${o.id}`}
                        name="method"
                        className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                      >
                        <option value="upi">UPI</option>
                        <option value="cash">{lang === "hi" ? "नकद" : "Cash"}</option>
                        <option value="bank">{lang === "hi" ? "बैंक ट्रांसफर" : "Bank transfer"}</option>
                        <option value="cheque">{lang === "hi" ? "चेक" : "Cheque"}</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor={`reference-${o.id}`}>{t("reference")}</Label>
                      <Input id={`reference-${o.id}`} name="reference" className="mt-1" />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full" disabled={recordPayment.isPending}>
                        {recordPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("save")}
                      </Button>
                    </div>
                  </form>
                )}

                {invoiceFor === o.id && (
                  <Invoice
                    order={o}
                    payments={(payments.data ?? []).filter((p) => p.order_id === o.id)}
                    sellerName={profile.data?.full_name ?? null}
                    sellerPlace={
                      [profile.data?.village, profile.data?.district].filter(Boolean).join(", ") || null
                    }
                  />
                )}

                {chatFor === o.id && uid && (
                  <OrderChat orderId={o.id} uid={uid} senderName={profile.data?.full_name ?? null} />
                )}
              </li>

            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

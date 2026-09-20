import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Tractor, Loader2, Trash2, CalendarDays, Check, X, NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { equipmentQuery, equipmentBookingsQuery, equipmentLogsQuery, type Equipment } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/equipment")({
  head: () => ({
    meta: [
      { title: "Equipment Rental — SasyaVediX" },
      { name: "description", content: "Hire tractors, harvesters and sprayers by the day from nearby farmers." },
      { property: "og:title", content: "Equipment Rental — SasyaVediX" },
      { property: "og:description", content: "Hire farm machines by the day, or list your own to earn." },
    ],
  }),
  component: EquipmentPage,
});

const KINDS = ["tractor", "harvester", "sprayer", "thresher", "seeder", "trolley", "other"] as const;

const STATUS_TONE: Record<string, string> = {
  requested: "bg-accent/15 text-accent-foreground",
  accepted: "bg-primary/15 text-primary",
  declined: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-primary/15 text-primary",
};

function EquipmentPage() {
  const { user } = useAuth();
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const equipment = useQuery(equipmentQuery);
  const bookings = useQuery(equipmentBookingsQuery);
  const logs = useQuery(equipmentLogsQuery);
  const [bookFor, setBookFor] = useState<string | null>(null);
  const [logFor, setLogFor] = useState<string | null>(null);

  const uid = user?.id ?? null;
  const all = equipment.data ?? [];
  const mine = all.filter((e) => e.owner_id === uid);
  const others = all.filter((e) => e.owner_id !== uid);
  const myBookings = bookings.data ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["equipment"] });
    qc.invalidateQueries({ queryKey: ["equipment_bookings"] });
    qc.invalidateQueries({ queryKey: ["equipment_logs"] });
  };

  const earningsFor = (equipmentId: string) => {
    const done = myBookings.filter(
      (b) => b.equipment_id === equipmentId && ["accepted", "completed"].includes(b.status),
    );
    return {
      total: done.reduce((s, b) => s + b.total_amount, 0),
      count: done.length,
      days: done.reduce((s, b) => s + b.days, 0),
    };
  };

  const addLog = useMutation({
    mutationFn: async (fd: FormData) => {
      if (!uid || !logFor) throw new Error("Not signed in");
      const { error } = await supabase.from("equipment_logs").insert({
        equipment_id: logFor,
        owner_id: uid,
        used_on: String(fd.get("used_on")) || new Date().toISOString().slice(0, 10),
        hours: fd.get("hours") ? Number(fd.get("hours")) : null,
        note: String(fd.get("note") ?? "").trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "रजिस्टर में जुड़ गया" : "Log entry saved");
      setLogFor(null);
      qc.invalidateQueries({ queryKey: ["equipment_logs"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const addMachine = useMutation({
    mutationFn: async (fd: FormData) => {
      if (!uid) throw new Error("Not signed in");
      const { error } = await supabase.from("equipment").insert({
        owner_id: uid,
        name: String(fd.get("name")).trim(),
        kind: String(fd.get("kind")),
        rate_per_day: Number(fd.get("rate_per_day")),
        location: String(fd.get("location") ?? "").trim() || null,
        district: String(fd.get("district") ?? "").trim() || null,
        description: String(fd.get("description") ?? "").trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "मशीन जुड़ गई!" : "Machine listed!");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const toggleAvailable = useMutation({
    mutationFn: async (eq: Equipment) => {
      const { error } = await supabase.from("equipment").update({ available: !eq.available }).eq("id", eq.id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const removeMachine = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const book = useMutation({
    mutationFn: async (payload: { eq: Equipment; form: HTMLFormElement }) => {
      if (!uid) throw new Error("Not signed in");
      const fd = new FormData(payload.form);
      const days = Math.max(1, Number(fd.get("days")) || 1);
      const { error } = await supabase.from("equipment_bookings").insert({
        equipment_id: payload.eq.id,
        farmer_id: uid,
        owner_id: payload.eq.owner_id,
        start_date: String(fd.get("start_date")),
        days,
        total_amount: days * payload.eq.rate_per_day,
        note: String(fd.get("note") ?? "").trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBookFor(null);
      toast.success(t("bookingSent"));
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("equipment_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const eqName = (id: string) => all.find((e) => e.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="rounded-2xl gradient-field p-3 text-primary-foreground shadow-md">
          <Tractor className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold">{t("equipment")}</h1>
          <p className="text-sm text-muted-foreground">{t("equipmentHint")}</p>
        </div>
      </header>

      {/* List your machine */}
      <section className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-heading text-lg font-semibold">{t("listEquipment")}</h2>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            e.currentTarget.reset();
            addMachine.mutate(fd);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("machineName")}</Label>
            <Input id="name" name="name" required placeholder={lang === "hi" ? "जैसे महिंद्रा 575" : "e.g. Mahindra 575"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kind">{t("machineKind")}</Label>
            <select id="kind" name="kind" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate_per_day">{t("ratePerDay")}</Label>
            <Input id="rate_per_day" name="rate_per_day" type="number" min={1} required placeholder="2500" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">{t("village")}</Label>
            <Input id="location" name="location" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">{t("district")}</Label>
            <Input id="district" name="district" />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="description">{t("notes")}</Label>
            <Input id="description" name="description" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={addMachine.isPending}>
              {addMachine.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("addMachine")}
            </Button>
          </div>
        </form>

        {mine.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t("myMachines")}</h3>
            {mine.map((m) => {
              const earn = earningsFor(m.id);
              const machineLogs = (logs.data ?? []).filter((l) => l.equipment_id === m.id);
              return (
                <div key={m.id} className="space-y-2 rounded-xl border bg-background/60 p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{m.kind}</span>
                    <span className="text-sm">₹{m.rate_per_day}/{t("days").toLowerCase().slice(0, lang === "hi" ? 3 : 3)}</span>
                    <button
                      type="button"
                      onClick={() => toggleAvailable.mutate(m)}
                      className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${m.available ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {m.available ? t("available") : t("notAvailable")}
                    </button>
                    <button
                      type="button"
                      aria-label={t("delete")}
                      onClick={() => removeMachine.mutate(m.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-4 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                    <span>{t("earnings")}: <strong>₹{earn.total.toLocaleString("en-IN")}</strong></span>
                    <span>{t("bookingsCount")}: <strong>{earn.count}</strong></span>
                    <span>{t("daysBooked")}: <strong>{earn.days}</strong></span>
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1 font-medium text-primary"
                      onClick={() => setLogFor(logFor === m.id ? null : m.id)}
                    >
                      <NotebookPen className="h-3.5 w-3.5" /> {t("usageLog")}
                    </button>
                  </div>

                  {logFor === m.id && (
                    <div className="space-y-2 rounded-lg border p-3">
                      <form
                        className="grid gap-2 sm:grid-cols-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          e.currentTarget.reset();
                          addLog.mutate(fd);
                        }}
                      >
                        <div className="space-y-1">
                          <Label htmlFor={`uo-${m.id}`}>{t("usedOn")}</Label>
                          <Input id={`uo-${m.id}`} name="used_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`hr-${m.id}`}>{t("hours")}</Label>
                          <Input id={`hr-${m.id}`} name="hours" type="number" min="0" step="0.5" placeholder="4" />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor={`nt-${m.id}`}>{t("notes")}</Label>
                          <Input id={`nt-${m.id}`} name="note" placeholder={lang === "hi" ? "जैसे: रामू के खेत में जुताई" : "e.g. ploughing at Ramesh's field"} />
                        </div>
                        <div className="sm:col-span-4">
                          <Button size="sm" type="submit" disabled={addLog.isPending}>
                            {addLog.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("addLog")}
                          </Button>
                        </div>
                      </form>
                      {machineLogs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t("noLogs")}</p>
                      ) : (
                        <ul className="space-y-1 text-xs">
                          {machineLogs.map((l) => (
                            <li key={l.id} className="flex flex-wrap gap-2">
                              <span className="font-medium">{l.used_on}</span>
                              {l.hours != null && <span>{l.hours} {t("hours").toLowerCase()}</span>}
                              {l.note && <span className="text-muted-foreground">· {l.note}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Browse machines */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("equipment")}</h2>
        {equipment.isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : others.length === 0 ? (
          <p className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">{t("noEquipment")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((eq) => (
              <article key={eq.id} className="glass-card lift-hover rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading font-semibold">{eq.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {eq.kind}
                      {eq.district ? ` · ${eq.district}` : ""}
                      {eq.location ? `, ${eq.location}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${eq.available ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {eq.available ? t("available") : t("notAvailable")}
                  </span>
                </div>
                <p className="text-xl font-bold text-primary">
                  ₹{eq.rate_per_day}
                  <span className="text-sm font-normal text-muted-foreground"> / {lang === "hi" ? "दिन" : "day"}</span>
                </p>
                {eq.description && <p className="text-sm text-muted-foreground">{eq.description}</p>}
                {eq.available &&
                  (bookFor === eq.id ? (
                    <form
                      className="space-y-3 rounded-xl border bg-background/60 p-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        book.mutate({ eq, form: e.currentTarget });
                      }}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`sd-${eq.id}`}>{t("startDate")}</Label>
                          <Input id={`sd-${eq.id}`} name="start_date" type="date" required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`d-${eq.id}`}>{t("days")}</Label>
                          <Input id={`d-${eq.id}`} name="days" type="number" min={1} defaultValue={1} required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`n-${eq.id}`}>{t("notes")}</Label>
                        <Input id={`n-${eq.id}`} name="note" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={book.isPending}>
                          {book.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                          {t("bookNow")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setBookFor(null)}>
                          {t("cancel")}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => setBookFor(eq.id)}>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {t("bookNow")}
                    </Button>
                  ))}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Bookings */}
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("bookingRequests")}</h2>
        {bookings.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : myBookings.length === 0 ? (
          <p className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">{t("noBookings")}</p>
        ) : (
          <div className="space-y-3">
            {myBookings.map((b) => {
              const isOwner = b.owner_id === uid;
              return (
                <div key={b.id} className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{eqName(b.equipment_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.start_date} · {b.days} {lang === "hi" ? "दिन" : "days"} · ₹{b.total_amount}
                      {isOwner ? (lang === "hi" ? " · आपकी मशीन" : " · your machine") : ""}
                    </p>
                    {b.note && <p className="text-xs text-muted-foreground mt-1">{b.note}</p>}
                  </div>
                  <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONE[b.status] ?? "bg-muted"}`}>
                    {t(b.status as "requested")}
                  </span>
                  {isOwner && b.status === "requested" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setStatus.mutate({ id: b.id, status: "accepted" })}>
                        <Check className="mr-1 h-3 w-3" />
                        {t("accept")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: b.id, status: "declined" })}>
                        <X className="mr-1 h-3 w-3" />
                        {t("decline")}
                      </Button>
                    </div>
                  )}
                  {isOwner && b.status === "accepted" && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus.mutate({ id: b.id, status: "completed" })}>
                      {t("completedBooking")}
                    </Button>
                  )}
                  {!isOwner && b.status === "requested" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: b.id, status: "cancelled" })}>
                      {t("cancel")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, Circle, Sprout, Trash2, Wheat } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import {
  cropPlansQuery,
  cropTasksQuery,
  latestByCropMandi,
  marketPricesQuery,
  varietiesQuery,
  type CropTask,
} from "@/lib/queries";
import { CROP_TEMPLATES, TASK_KIND_LABEL, addDays, templateFor, type TaskKind } from "@/lib/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Crop Calendar & Reminders — SasyaVediX" },
      {
        name: "description",
        content:
          "Plan each crop from sowing to harvest with irrigation, fertiliser and spray reminders.",
      },
      { property: "og:title", content: "Crop Calendar & Reminders — SasyaVediX" },
      {
        property: "og:description",
        content: "A sowing-to-harvest schedule with field reminders for every crop you grow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

const TODAY = () => new Date().toISOString().slice(0, 10);

function CalendarPage() {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [harvestFor, setHarvestFor] = useState<string | null>(null);
  const plans = useQuery(cropPlansQuery);
  const tasks = useQuery(cropTasksQuery);
  const varieties = useQuery(varietiesQuery);
  const prices = useQuery(marketPricesQuery);

  const createPlan = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fd = new FormData(form);
      const crop = String(fd.get("crop") ?? "");
      const sowing = String(fd.get("sowing_date") ?? "");
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("not signed in");
      const tpl = templateFor(crop);

      const { data: plan, error } = await supabase
        .from("crop_plans")
        .insert({
          farmer_id: auth.user.id,
          crop,
          variety: String(fd.get("variety") ?? "").trim() || null,
          sowing_date: sowing,
          harvest_date: addDays(sowing, tpl.durationDays),
          area_acres: fd.get("area_acres") ? Number(fd.get("area_acres")) : null,
        })
        .select("id")
        .single();
      if (error) throw error;

      const rows = tpl.tasks.map((task) => ({
        plan_id: plan.id,
        farmer_id: auth.user!.id,
        kind: task.kind,
        title_en: task.en,
        title_hi: task.hi,
        due_date: addDays(sowing, task.day),
      }));
      const { error: taskErr } = await supabase.from("crop_tasks").insert(rows);
      if (taskErr) throw taskErr;
      form.reset();
    },
    onSuccess: () => {
      toast.success(lang === "hi" ? "योजना और रिमाइंडर बन गए" : "Plan and reminders created");
      qc.invalidateQueries({ queryKey: ["crop_plans"] });
      qc.invalidateQueries({ queryKey: ["crop_tasks"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create the plan"),
  });

  const toggleTask = useMutation({
    mutationFn: async (task: CropTask) => {
      const { error } = await supabase
        .from("crop_tasks")
        .update({ done: !task.done, done_on: task.done ? null : TODAY() })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crop_tasks"] }),
  });

  const removePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crop_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crop_plans"] });
      qc.invalidateQueries({ queryKey: ["crop_tasks"] });
    },
  });

  const all = tasks.data ?? [];
  const today = TODAY();
  const open = all.filter((x) => !x.done);
  const overdue = open.filter((x) => x.due_date < today);
  const dueToday = open.filter((x) => x.due_date === today);
  const upcoming = open.filter((x) => x.due_date > today).slice(0, 12);

  const planName = (id: string) => {
    const p = (plans.data ?? []).find((x) => x.id === id);
    return p ? `${p.crop}${p.variety ? ` · ${p.variety}` : ""}` : "";
  };

  const TaskList = ({ items, tone }: { items: CropTask[]; tone?: string }) =>
    items.length === 0 ? null : (
      <ul className="space-y-2">
        {items.map((task) => (
          <li
            key={task.id}
            className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${
              tone ?? "border-border bg-card/60"
            }`}
          >
            <button
              className="flex items-center gap-3 text-left"
              onClick={() => toggleTask.mutate(task)}
            >
              {task.done ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
              <span>
                <span className="font-medium">{lang === "hi" ? task.title_hi : task.title_en}</span>
                <span className="block text-sm text-muted-foreground">
                  {planName(task.plan_id)} ·{" "}
                  {TASK_KIND_LABEL[(task.kind as TaskKind) ?? "general"]?.[lang] ?? task.kind} ·{" "}
                  {new Date(`${task.due_date}T00:00:00`).toLocaleDateString("en-IN")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">{t("cropCalendar")}</h1>
        <p className="text-muted-foreground">
          {lang === "hi"
            ? "बुवाई से कटाई तक हर काम की तारीख, आपकी फसल के हिसाब से।"
            : "Every field job dated from sowing to harvest, tuned to your crop."}
        </p>
      </header>

      <section className="glass-card rounded-3xl p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
          <Sprout className="h-5 w-5 text-primary" />
          {t("newPlan")}
        </h2>
        <form
          className="grid gap-3 sm:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            createPlan.mutate(e.currentTarget);
          }}
        >
          <div>
            <Label htmlFor="crop">{t("crop")}</Label>
            <select
              id="crop"
              name="crop"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {CROP_TEMPLATES.map((c) => (
                <option key={c.crop} value={c.crop}>
                  {c.crop}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="variety">{t("variety")}</Label>
            <Input id="variety" name="variety" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="sowing_date">{t("sowingDate")}</Label>
            <Input id="sowing_date" name="sowing_date" type="date" defaultValue={today} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="area_acres">{t("area")}</Label>
            <Input id="area_acres" name="area_acres" type="number" step="0.1" min="0" className="mt-1" />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={createPlan.isPending}>
              {t("createPlan")}
            </Button>
          </div>
        </form>
      </section>

      {tasks.isLoading ? (
        <Skeleton className="h-40 w-full rounded-3xl" />
      ) : (
        <section className="space-y-5">
          {overdue.length > 0 && (
            <div>
              <h2 className="mb-2 font-display text-lg font-bold text-destructive">{t("overdue")}</h2>
              <TaskList items={overdue} tone="border-destructive/40 bg-destructive/5" />
            </div>
          )}
          {dueToday.length > 0 && (
            <div>
              <h2 className="mb-2 font-display text-lg font-bold">{t("dueToday")}</h2>
              <TaskList items={dueToday} tone="border-primary/40 bg-card" />
            </div>
          )}
          <div>
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
              <CalendarDays className="h-5 w-5 text-primary" />
              {t("upcomingTasks")}
            </h2>
            {upcoming.length === 0 ? (
              <p className="glass-card rounded-3xl p-6 text-sm text-muted-foreground">{t("noPlans")}</p>
            ) : (
              <TaskList items={upcoming} />
            )}
          </div>
        </section>
      )}

      {(plans.data ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">
            {lang === "hi" ? "मेरी फसल योजनाएं" : "My crop plans"}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {(plans.data ?? []).map((p) => {
              const planTasks = all.filter((x) => x.plan_id === p.id);
              const doneCount = planTasks.filter((x) => x.done).length;
              const pct = planTasks.length ? Math.round((doneCount / planTasks.length) * 100) : 0;
              return (
                <li key={p.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {p.crop}
                        {p.variety ? ` · ${p.variety}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(`${p.sowing_date}T00:00:00`).toLocaleDateString("en-IN")} →{" "}
                        {p.harvest_date
                          ? new Date(`${p.harvest_date}T00:00:00`).toLocaleDateString("en-IN")
                          : "—"}
                        {p.area_acres ? ` · ${p.area_acres} ${lang === "hi" ? "एकड़" : "acres"}` : ""}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePlan.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full gradient-field" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {doneCount}/{planTasks.length} {t("done")}
                  </p>
                  {(() => {
                    if (!p.area_acres) return null;
                    const vs = (varieties.data ?? []).filter(
                      (x) => x.crop.toLowerCase() === p.crop.toLowerCase(),
                    );
                    const v =
                      (p.variety
                        ? vs.find(
                            (x) => x.name_en.toLowerCase() === String(p.variety).toLowerCase(),
                          )
                        : null) ?? vs[0];
                    const yieldQ =
                      v?.yield_quintal_per_acre != null
                        ? Number(v.yield_quintal_per_acre) * Number(p.area_acres)
                        : null;
                    if (yieldQ == null) return null;
                    const mandi = latestByCropMandi(prices.data ?? [])
                      .filter((x) => x.crop.toLowerCase() === p.crop.toLowerCase())
                      .sort((a, b) => b.price - a.price)[0];
                    return (
                      <p className="mt-2 flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-medium">
                        <Wheat className="h-3.5 w-3.5 text-primary" />
                        {t("expectedYield")}: ~{Math.round(yieldQ).toLocaleString("en-IN")}{" "}
                        {t("quintal")}
                        {mandi && (
                          <span className="text-primary">
                            · {t("expectedValue")}: ₹
                            {Math.round(yieldQ * mandi.price).toLocaleString("en-IN")}
                          </span>
                        )}
                      </p>
                    );
                  })()}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

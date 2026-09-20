import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import { LOCATIONS } from "@/lib/locations";
import {
  cropPlansQuery,
  farmExpensesQuery,
  farmFieldsQuery,
  type FarmField,
} from "@/lib/queries";
import { toast } from "sonner";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/fields")({
  head: () => ({
    meta: [
      { title: "My Fields — SasyaVediX" },
      {
        name: "description",
        content:
          "Register your farm fields with soil type and irrigation, and track plans and expenses per field.",
      },
    ],
  }),
  component: FieldsPage,
});

const SOIL_TYPES = ["black", "alluvial", "red", "sandy", "clay", "loamy"];
const IRRIGATION = ["rainfed", "canal", "borewell", "drip", "sprinkler"];

function FieldsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();

  const fields = useQuery(farmFieldsQuery);
  const plans = useQuery(cropPlansQuery);
  const expenses = useQuery(farmExpensesQuery);

  const [district, setDistrict] = useState("");
  const [soil, setSoil] = useState("");
  const [irrig, setIrrig] = useState("rainfed");

  const addField = useMutation({
    mutationFn: async (f: FormData) => {
      const { error } = await supabase.from("farm_fields").insert({
        farmer_id: uid as string,
        name: String(f.get("name")),
        acres: Number(f.get("acres")),
        village: String(f.get("village")) || null,
        district: district || null,
        soil_type: soil || null,
        irrigation: irrig,
        notes: String(f.get("notes")) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farm_fields"] });
      toast.success(t("fieldAdded"));
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteField = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("farm_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farm_fields"] }),
  });

  const stats = (f: FarmField) => {
    const fieldPlans = (plans.data ?? []).filter((p) => p.field_id === f.id);
    const fieldExp = (expenses.data ?? []).filter((e) => e.field_id === f.id);
    const spent = fieldExp.reduce((s, e) => s + e.amount, 0);
    const harvested = fieldPlans.filter((p) => p.status === "harvested");
    return { active: fieldPlans.filter((p) => p.status === "active").length, spent, harvested: harvested.length };
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("fields")}</h1>
        <p className="mt-1 text-muted-foreground">{t("fieldsHint")}</p>
      </div>

      <form
        className="glass-card grid gap-4 p-6 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          addField.mutate(fd);
          e.currentTarget.reset();
          setDistrict("");
          setSoil("");
          setIrrig("rainfed");
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("fieldName")}</Label>
          <Input id="name" name="name" required placeholder="e.g. North plot" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acres">{t("area")}</Label>
          <Input id="acres" name="acres" type="number" step="0.1" min="0.1" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="village">{t("village")}</Label>
          <Input id="village" name="village" />
        </div>
        <div className="space-y-1.5">
          <Label>{t("district")}</Label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger aria-label="district">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l.en} value={l.en}>
                  {l.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("soilType")}</Label>
          <Select value={soil} onValueChange={setSoil}>
            <SelectTrigger aria-label="soil type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOIL_TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`soil_${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("irrigation")}</Label>
          <Select value={irrig} onValueChange={setIrrig}>
            <SelectTrigger aria-label="irrigation">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IRRIGATION.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`irr_${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">{t("notes")}</Label>
          <Input id="notes" name="notes" />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="gradient-field w-full" disabled={addField.isPending}>
            <Plus className="mr-1 h-4 w-4" /> {t("addField")}
          </Button>
        </div>
      </form>

      {(fields.data ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground">
          {t("noFields")}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(fields.data ?? []).map((f) => {
            const s = stats(f);
            return (
              <div key={f.id} className="glass-card space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{f.name}</h3>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {[f.village, f.district].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  <button
                    aria-label="delete field"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteField.mutate(f.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="font-semibold">{f.acres}</p>
                    <p className="text-xs text-muted-foreground">{t("acres")}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="font-semibold">{s.active}</p>
                    <p className="text-xs text-muted-foreground">{t("activePlans")}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="font-semibold">{s.harvested}</p>
                    <p className="text-xs text-muted-foreground">{t("harvests")}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {f.soil_type && (
                    <span className="rounded-full bg-secondary px-2.5 py-1">{t(`soil_${f.soil_type}`)}</span>
                  )}
                  {f.irrigation && (
                    <span className="rounded-full bg-secondary px-2.5 py-1">{t(`irr_${f.irrigation}`)}</span>
                  )}
                  <span className="rounded-full bg-secondary px-2.5 py-1">
                    {t("spent")}: ₹{s.spent.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

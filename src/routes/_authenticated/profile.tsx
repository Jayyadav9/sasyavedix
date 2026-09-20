import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { profileQuery } from "@/lib/queries";
import { LOCATIONS } from "@/lib/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Farm Profile — SasyaVediX" },
      {
        name: "description",
        content:
          "Save your name, village, district, state and land size so every SasyaVediX page is tuned to your farm.",
      },
      { property: "og:title", content: "My Farm Profile — SasyaVediX" },
      {
        property: "og:description",
        content: "Farmer profile: village, district, land size and preferred language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const blank = {
  full_name: "",
  phone: "",
  village: "",
  district: "",
  state: "",
  land_acres: "",
};

function ProfilePage() {
  const { lang, setLang } = useLang();
  const hi = lang === "hi";
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery(profileQuery);
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      village: profile.village ?? "",
      district: profile.district ?? "",
      state: profile.state ?? "",
      land_acres: profile.land_acres == null ? "" : String(profile.land_acres),
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("no session");
      const payload = {
        id: auth.user.id,
        full_name: form.full_name.trim() || "Farmer",
        phone: form.phone.trim() || null,
        village: form.village.trim() || null,
        district: form.district || null,
        state: form.state.trim() || null,
        land_acres: form.land_acres ? Number(form.land_acres) : null,
        language: lang,
      };
      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(hi ? "प्रोफ़ाइल सहेजी गई" : "Profile saved");
    },
    onError: () => toast.error(hi ? "सहेजा नहीं जा सका" : "Could not save your profile"),
  });

  const filled = [form.full_name, form.phone, form.village, form.district, form.land_acres].filter(
    Boolean,
  ).length;
  const percent = Math.round((filled / 5) * 100);

  function set(key: keyof typeof blank, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-field">
          <UserRound className="h-7 w-7 text-primary-foreground" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold">
            {hi ? "मेरी खेती की प्रोफ़ाइल" : "My farm profile"}
          </h1>
          <p className="text-muted-foreground">
            {hi
              ? "ये जानकारी भरें ताकि भाव, मौसम और सलाह आपके खेत के अनुसार मिलें।"
              : "Fill this in so prices, weather and advice match your own field."}
          </p>
        </div>
      </header>

      <div className="glass-card rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between text-sm font-medium">
          <span>{hi ? "प्रोफ़ाइल पूर्णता" : "Profile completeness"}</span>
          <span className="text-primary">{percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full gradient-harvest transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <form
        className="glass-card grid gap-5 rounded-2xl p-6 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="full_name">{hi ? "आपका नाम" : "Your name"}</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder={hi ? "रमेश पटेल" : "Ramesh Patel"}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{hi ? "मोबाइल नंबर" : "Mobile number"}</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value.replace(/[^\d+ ]/g, ""))}
            placeholder="98765 43210"
            inputMode="tel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="village">{hi ? "गाँव" : "Village"}</Label>
          <Input
            id="village"
            value={form.village}
            onChange={(e) => set("village", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">{hi ? "जिला / नजदीकी मंडी" : "District / nearest mandi"}</Label>
          <select
            id="district"
            aria-label="district"
            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={form.district}
            onChange={(e) => {
              const picked = LOCATIONS.find((l) => l.en === e.target.value);
              setForm((f) => ({
                ...f,
                district: e.target.value,
                state: picked ? picked.state : f.state,
              }));
            }}
          >
            <option value="">{hi ? "चुनें" : "Select"}</option>
            {LOCATIONS.map((l) => (
              <option key={l.id} value={l.en}>
                {hi ? l.hi : l.en}
              </option>
            ))}
          </select>

        </div>

        <div className="space-y-2">
          <Label htmlFor="state">{hi ? "राज्य" : "State"}</Label>
          <Input id="state" value={form.state} onChange={(e) => set("state", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="land_acres">{hi ? "जमीन (एकड़)" : "Land size (acres)"}</Label>
          <Input
            id="land_acres"
            type="number"
            step="0.1"
            min="0"
            value={form.land_acres}
            onChange={(e) => set("land_acres", e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>{hi ? "पसंदीदा भाषा" : "Preferred language"}</Label>
          <div className="flex overflow-hidden rounded-full border border-border text-sm font-semibold">
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`flex-1 px-3 py-2 transition-colors ${
                  lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {l === "en" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hi ? "प्रोफ़ाइल सहेजें" : "Save profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}

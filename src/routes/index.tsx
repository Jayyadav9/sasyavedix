import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf, CloudSun, LineChart, Sprout, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import farmHero from "@/assets/farm-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SasyaVediX — Farmer Login | Smart Farming for Smart India" },
      {
        name: "description",
        content:
          "Sign in to SasyaVediX for live mandi prices, crop variety guidance, weather and government schemes.",
      },
      { property: "og:title", content: "SasyaVediX — Smart Farming for Smart India" },
      {
        property: "og:description",
        content: "Farmer-first platform for mandi prices, crop intelligence and schemes.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useLang();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"farmer" | "buyer">("farmer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName || email.split("@")[0] },
          },
        });
        if (err) throw err;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <img
        src={farmHero}
        alt="Indian farmer walking through a wheat field at sunrise"
        width={1600}
        height={1200}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 gradient-dawn" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:gap-16">
        {/* Brand side */}
        <section className="text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl gradient-harvest shadow-[var(--shadow-lift)]">
              <Leaf className="h-6 w-6 text-accent-foreground" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold leading-none">{t("appName")}</h1>
              <p className="text-sm opacity-85">{t("tagline")}</p>
            </div>
          </div>

          <h2 className="mt-10 max-w-lg font-display text-4xl font-bold leading-tight sm:text-5xl">
            {t("aiPowered")}
          </h2>
          <p className="mt-3 max-w-md text-lg opacity-85">{t("farmerTagline")}</p>

          <ul className="mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: CloudSun, label: t("realtimeWeather") },
              { icon: LineChart, label: t("liveMarket") },
              { icon: Sprout, label: t("soilIntel") },
              { icon: Bot, label: t("aiAssistant") },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="glass-dark lift-hover flex items-center gap-3 rounded-2xl px-4 py-3"
              >
                <Icon className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Login card */}
        <section className="glass-card mx-auto w-full max-w-md rounded-3xl p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold">
                {mode === "signin" ? t("signIn") : t("signUp")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("tagline")}</p>
            </div>
            <div className="flex overflow-hidden rounded-full border border-border text-xs font-semibold">
              {(["en", "hi"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 transition-colors ${
                    lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("fullName")}</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jay Yadav"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? t("signIn") : t("signUp")}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle}>
            {t("continueGoogle")}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-sm font-medium text-primary hover:underline"
          >
            {mode === "signin" ? t("noAccount") : t("haveAccount")}
          </button>
        </section>
      </div>
    </main>
  );
}

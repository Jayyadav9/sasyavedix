import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CloudSun,
  ShoppingBasket,
  LineChart,
  ScanLine,
  Sprout,
  FlaskConical,
  Landmark,
  Bot,
  BarChart3,
  LogOut,
  Leaf,
  Menu,
  PackageCheck,
  Handshake,
  UserRound,
  CalendarDays,
  Bell,
  WifiOff,

} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useLang, type TKey } from "@/lib/i18n";
import { roleQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";

const FARMER_NAV: { to: string; key: TKey; icon: typeof LayoutDashboard }[] = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/weather", key: "weather", icon: CloudSun },
  { to: "/calendar", key: "cropCalendar", icon: CalendarDays },
  { to: "/sell", key: "sellCrop", icon: ShoppingBasket },
  { to: "/orders", key: "orders", icon: PackageCheck },
  { to: "/market", key: "marketPrices", icon: LineChart },
  { to: "/alerts", key: "alerts", icon: Bell },
  { to: "/analysis", key: "cropAnalysis", icon: ScanLine },
  { to: "/varieties", key: "cropVarieties", icon: Sprout },
  { to: "/soil", key: "soilHealth", icon: FlaskConical },
  { to: "/schemes", key: "schemes", icon: Landmark },
  { to: "/assistant", key: "aiAssistant", icon: Bot },
  { to: "/analytics", key: "analytics", icon: BarChart3 },
  { to: "/profile", key: "myProfile", icon: UserRound },
];


const BUYER_NAV: { to: string; key: TKey; icon: typeof LayoutDashboard }[] = [
  { to: "/buyer/browse", key: "browseCrops", icon: ShoppingBasket },
  { to: "/buyer/offers", key: "myOffers", icon: Handshake },
  { to: "/alerts", key: "alerts", icon: Bell },
  { to: "/market", key: "marketPrices", icon: LineChart },
  { to: "/weather", key: "weather", icon: CloudSun },
];


export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const role = useQuery(roleQuery);
  const NAV = role.isPending ? [] : role.data === "buyer" ? BUYER_NAV : FARMER_NAV;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map(({ to, key, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl gradient-harvest">
            <Leaf className="h-5 w-5 text-accent-foreground" />
          </span>
          <div>
            <p className="font-display text-lg font-bold leading-none text-sidebar-foreground">
              {t("appName")}
            </p>
            <p className="text-[11px] text-sidebar-foreground/70">{t("tagline")}</p>
          </div>
        </div>

        {nav}

        <div className="space-y-3 border-t border-sidebar-border p-3">
          <div className="flex overflow-hidden rounded-full border border-sidebar-border text-xs font-semibold">
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 px-3 py-1.5 transition-colors ${
                  lang === l
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70"
                }`}
              >
                {l === "en" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </Button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display text-lg font-bold">{t("appName")}</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Loader2,
  RefreshCw,
  Database,
} from "lucide-react";
import { toast } from "sonner";

import { useLang } from "@/lib/i18n";
import { mandiFeedStatus, syncMandiPrices } from "@/lib/mandi.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/mandi-setup")({
  head: () => ({
    meta: [
      { title: "Connect Live Mandi Rates — SasyaVediX" },
      {
        name: "description",
        content:
          "Connect the government data.gov.in mandi price feed so SasyaVediX shows real daily rates from your district markets.",
      },
      { property: "og:title", content: "Connect Live Mandi Rates — SasyaVediX" },
      {
        property: "og:description",
        content: "Set up the official government mandi price feed for real daily rates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MandiSetupPage,
});

const STEPS_EN = [
  {
    title: "Register on data.gov.in",
    body: "Create a free account on the Government of India Open Data portal. Any citizen can sign up with an email and mobile number.",
    link: "https://www.data.gov.in/user/register",
    linkText: "Open registration page",
  },
  {
    title: "Copy your API key",
    body: "After signing in, open My Account. The portal shows a personal API key (a long string of letters and numbers). Copy it.",
    link: "https://www.data.gov.in/user",
    linkText: "Open My Account",
  },
  {
    title: "Give the key to SasyaVediX",
    body: "Ask in chat to save the mandi price key. A secure box opens where you paste it — it is stored safely and never shown on any screen.",
    link: null,
    linkText: null,
  },
  {
    title: "Fetch the rates",
    body: "Once saved, press the button below. SasyaVediX pulls today's rates for your districts from the official daily mandi dataset, every time you press it.",
    link: "https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi",
    linkText: "See the official dataset",
  },
];

const STEPS_HI = [
  {
    title: "data.gov.in पर रजिस्टर करें",
    body: "भारत सरकार के ओपन डेटा पोर्टल पर मुफ़्त खाता बनाएं। ईमेल और मोबाइल नंबर से कोई भी नागरिक बना सकता है।",
    link: "https://www.data.gov.in/user/register",
    linkText: "रजिस्ट्रेशन पेज खोलें",
  },
  {
    title: "अपनी API key कॉपी करें",
    body: "लॉगिन करने के बाद My Account खोलें। वहाँ आपकी निजी API key (अक्षरों और अंकों की लंबी लाइन) दिखेगी। उसे कॉपी करें।",
    link: "https://www.data.gov.in/user",
    linkText: "My Account खोलें",
  },
  {
    title: "key SasyaVediX को दें",
    body: "चैट में कहें कि मंडी भाव की key सेव करनी है। एक सुरक्षित बॉक्स खुलेगा जिसमें आप उसे पेस्ट करें — वह सुरक्षित रहती है, कहीं दिखती नहीं।",
    link: null,
    linkText: null,
  },
  {
    title: "भाव लाएं",
    body: "सेव होने के बाद नीचे बटन दबाएं। SasyaVediX सरकारी रोज़ाना मंडी डेटा से आपके जिलों के आज के भाव ले आएगा।",
    link: "https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi",
    linkText: "सरकारी डेटासेट देखें",
  },
];

function MandiSetupPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ["mandi_feed_status"],
    queryFn: () => mandiFeedStatus(),
  });

  const sync = useMutation({
    mutationFn: () => syncMandiPrices(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["mandi_feed_status"] });
      if (!res.configured) {
        toast.info(
          lang === "hi"
            ? "मंडी key अभी सेव नहीं हुई है। ऊपर के चरण पूरे करें।"
            : "The mandi key is not saved yet. Finish the steps above.",
        );
        return;
      }
      if (res.inserted === 0) {
        toast.info(
          lang === "hi" ? "आज आपके जिलों के भाव नहीं मिले।" : "No fresh rates for your districts.",
        );
        return;
      }
      qc.invalidateQueries({ queryKey: ["market_prices"] });
      toast.success(
        lang === "hi" ? `${res.inserted} भाव अपडेट हुए` : `${res.inserted} rates updated`,
      );
    },
    onError: () =>
      toast.error(lang === "hi" ? "भाव नहीं मिल सके" : "Could not fetch today's rates"),
  });

  const steps = lang === "hi" ? STEPS_HI : STEPS_EN;
  const connected = status.data?.configured ?? false;
  const liveRows = status.data?.liveRows ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">
          {lang === "hi" ? "असली मंडी भाव जोड़ें" : "Connect live mandi rates"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "hi"
            ? "सरकारी रोज़ाना मंडी डेटा जोड़ें, ताकि भाव नमूना आंकड़ों की जगह असली रहें।"
            : "Link the government daily mandi feed so prices come from real markets, not the built-in sample history."}
        </p>
      </header>

      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-start gap-3">
          {connected ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-primary" />
          ) : (
            <CircleAlert className="mt-0.5 h-6 w-6 text-muted-foreground" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              {status.isLoading
                ? lang === "hi"
                  ? "जाँच रहे हैं…"
                  : "Checking…"
                : connected
                  ? lang === "hi"
                    ? "सरकारी फ़ीड जुड़ी है"
                    : "Government feed is connected"
                  : lang === "hi"
                    ? "सरकारी फ़ीड अभी जुड़ी नहीं है"
                    : "Government feed is not connected yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {connected
                ? lang === "hi"
                  ? `${liveRows} असली भाव सेव हैं${status.data?.lastDate ? ` · आख़िरी तारीख़ ${status.data.lastDate}` : ""}`
                  : `${liveRows} real rates saved${status.data?.lastDate ? ` · latest ${status.data.lastDate}` : ""}`
                : lang === "hi"
                  ? "तब तक भाव 60 दिन के नमूना आंकड़ों से दिख रहे हैं।"
                  : "Until then, prices come from the built-in 60-day sample history."}
            </p>
          </div>
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="glass-card flex gap-4 rounded-3xl p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {i + 1}
            </span>
            <div className="space-y-2">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-muted-foreground">{s.body}</p>
              {s.link && (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {s.linkText}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="glass-card flex flex-wrap items-center gap-3 rounded-3xl p-5">
        <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
          {sync.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {lang === "hi" ? "आज के भाव लाएं" : "Fetch today's rates"}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/market">
            <Database className="mr-2 h-4 w-4" />
            {lang === "hi" ? "मंडी भाव देखें" : "See mandi prices"}
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {lang === "hi"
          ? `भाव इन जिलों के लिए लाए जाते हैं: ${(status.data?.districts ?? []).join(", ")}`
          : `Rates are fetched for these districts: ${(status.data?.districts ?? []).join(", ")}`}
      </p>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, User } from "lucide-react";
import { toast } from "sonner";

import { useLang } from "@/lib/i18n";
import { askAssistant } from "@/lib/ai.functions";
import { latestByCropMandi, marketPricesQuery, schemesQuery, soilTestsQuery } from "@/lib/queries";
import { LOCATIONS, findLocation } from "@/lib/locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Farmer Assistant — SasyaVediX" },
      {
        name: "description",
        content: "Ask farming questions and get answers grounded in mandi prices, schemes and weather.",
      },
      { property: "og:title", content: "AI Farmer Assistant — SasyaVediX" },
      {
        property: "og:description",
        content: "A farming assistant grounded in your crops, mandi prices and local conditions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const { lang } = useLang();
  const ask = useServerFn(askAssistant);
  const prices = useQuery(marketPricesQuery);
  const schemes = useQuery(schemesQuery);
  const soil = useQuery(soilTestsQuery);
  const [locId, setLocId] = useState("indore");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("sasyavedix-location");
    if (stored && LOCATIONS.some((l) => l.id === stored)) setLocId(stored);
  }, []);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const loc = findLocation(locId);

  const weather = useQuery({
    queryKey: ["forecast-brief", loc.id],
    queryFn: async () => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m&daily=precipitation_sum,temperature_2m_max&timezone=auto&forecast_days=5`,
      );
      if (!res.ok) throw new Error("weather");
      return res.json() as Promise<{
        current: { temperature_2m: number; relative_humidity_2m: number };
        daily: { precipitation_sum: number[]; temperature_2m_max: number[] };
      }>;
    },
    staleTime: 15 * 60 * 1000,
  });

  function buildContext() {
    const lines: string[] = [];
    lines.push(`Farmer location: ${loc.en}, ${loc.state}`);
    if (weather.data) {
      const rain = weather.data.daily.precipitation_sum.reduce((a, b) => a + b, 0);
      lines.push(
        `Weather now: ${Math.round(weather.data.current.temperature_2m)}°C, humidity ${Math.round(
          weather.data.current.relative_humidity_2m,
        )}%. Rain expected next 5 days: ${rain.toFixed(1)} mm.`,
      );
    }
    const latest = latestByCropMandi(prices.data ?? [])
      .sort((a, b) => b.price - a.price)
      .slice(0, 14);
    if (latest.length) {
      lines.push("Latest mandi prices (₹/quintal):");
      for (const p of latest) {
        lines.push(
          `- ${p.crop}${p.variety ? ` (${p.variety})` : ""} at ${p.market}, ${p.location}: ₹${p.price} on ${p.observed_on}`,
        );
      }
    }
    const sc = schemes.data ?? [];
    if (sc.length) {
      lines.push("Active government schemes:");
      for (const s of sc as { name_en: string; benefit: string; eligibility: string }[]) {
        lines.push(`- ${s.name_en}: ${s.benefit}. Eligibility: ${s.eligibility}`);
      }
    }
    const st = soil.data?.[0];
    if (st) {
      lines.push(
        `Farmer's latest soil test (${st.sample_date}): pH ${st.ph}, N ${st.nitrogen} kg/ha, P ${st.phosphorus} kg/ha, K ${st.potassium} kg/ha, organic carbon ${st.organic_carbon ?? "n/a"}%.`,
      );
    }
    return lines.join("\n");
  }

  const send = useMutation({
    mutationFn: async (question: string) => {
      const history = messages.slice(-8);
      const res = (await ask({
        data: { question, lang, context: buildContext(), history },
      })) as { answer: string };
      return res.answer;
    },
    onSuccess: (answer) => setMessages((m) => [...m, { role: "assistant", content: answer }]),
    onError: () => {
      setMessages((m) => m.slice(0, -1));
      toast.error(
        lang === "hi" ? "सहायक अभी जवाब नहीं दे पाया।" : "The assistant could not reply just now.",
      );
    },
  });

  function submit(text: string) {
    const q = text.trim();
    if (!q || send.isPending) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    send.mutate(q);
  }

  const suggestions =
    lang === "hi"
      ? [
          "आज गेहूं किस मंडी में सबसे अच्छा भाव दे रहा है?",
          "मेरी मिट्टी के हिसाब से अगली फसल कौन सी लगाऊं?",
          "PM-KISAN का पैसा कैसे मिलेगा?",
          "इस हफ्ते सिंचाई करूं या रुकूं?",
        ]
      : [
          "Which mandi is paying best for wheat today?",
          "Which crop should I sow next based on my soil?",
          "How do I get the PM-KISAN payment?",
          "Should I irrigate this week or wait?",
        ];

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {lang === "hi" ? "एआई किसान सहायक" : "AI Farmer Assistant"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "hi"
              ? "आपकी मंडी, योजनाओं, मिट्टी और मौसम के आंकड़ों पर आधारित जवाब।"
              : "Answers grounded in your mandi prices, schemes, soil and local weather."}
          </p>
        </div>
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={locId}
          onChange={(e) => {
            setLocId(e.target.value);
            window.localStorage.setItem("sasyavedix-location", e.target.value);
          }}
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {lang === "hi" ? l.hi : l.en}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card mt-4 flex min-h-0 flex-1 flex-col rounded-3xl p-4">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-field">
                <Bot className="h-7 w-7 text-primary-foreground" />
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                {lang === "hi" ? "कुछ भी पूछें:" : "Ask me anything:"}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-2xl border border-border bg-card/60 p-3 text-left text-sm transition hover:border-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-field">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </span>
              )}
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card/60"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted">
                  <User className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}

          {send.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {lang === "hi" ? "सोच रहा हूं…" : "Thinking…"}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === "hi" ? "अपना सवाल लिखें…" : "Type your question…"}
          />
          <Button type="submit" disabled={send.isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

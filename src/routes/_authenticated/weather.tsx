import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CloudRain,
  Droplets,
  Sun,
  Thermometer,
  Wind,
  AlertTriangle,
  SprayCan,
  Sprout,
} from "lucide-react";

import { useLang } from "@/lib/i18n";
import { LOCATIONS, findLocation, weatherLabel } from "@/lib/locations";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({
    meta: [
      { title: "Farm Weather — SasyaVediX" },
      {
        name: "description",
        content: "Live 7-day district weather with irrigation, sowing and spraying advisories.",
      },
      { property: "og:title", content: "Farm Weather — SasyaVediX" },
      {
        property: "og:description",
        content: "Live district forecasts and field advisories for Indian farmers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeatherPage,
});

type Forecast = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
};

function WeatherPage() {
  const { lang } = useLang();
  const [locId, setLocId] = useState("indore");

  useEffect(() => {
    const stored = window.localStorage.getItem("sasyavedix-location");
    if (stored && LOCATIONS.some((l) => l.id === stored)) setLocId(stored);
  }, []);

  const loc = findLocation(locId);

  const q = useQuery({
    queryKey: ["forecast", loc.id],
    queryFn: async (): Promise<Forecast> => {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max" +
        "&timezone=auto&forecast_days=7";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Weather service unavailable");
      return res.json();
    },
    staleTime: 15 * 60 * 1000,
  });

  const d = q.data;
  const rain3 = d ? d.daily.precipitation_sum.slice(0, 3).reduce((a, b) => a + b, 0) : 0;
  const maxWind = d ? Math.max(...d.daily.wind_speed_10m_max.slice(0, 3)) : 0;
  const maxTemp = d ? Math.max(...d.daily.temperature_2m_max.slice(0, 3)) : 0;
  const stormy = d ? d.daily.weather_code.slice(0, 3).some((c) => c >= 95) : false;

  const advisories: { icon: typeof Droplets; tone: string; text: string }[] = d
    ? [
        {
          icon: Droplets,
          tone: rain3 >= 10 ? "text-primary" : "text-warning",
          text:
            rain3 >= 10
              ? lang === "hi"
                ? `अगले 3 दिनों में ${rain3.toFixed(0)} मि.मी. बारिश — सिंचाई रोक दें और खेत से पानी निकालने की नाली साफ रखें।`
                : `${rain3.toFixed(0)} mm rain expected in 3 days — hold irrigation and keep field drains clear.`
              : lang === "hi"
                ? "बारिश की संभावना कम — सुबह या शाम को सिंचाई करें, दोपहर में नहीं।"
                : "Little rain expected — irrigate early morning or evening, not at noon.",
        },
        {
          icon: SprayCan,
          tone: rain3 >= 5 || maxWind > 20 ? "text-destructive" : "text-primary",
          text:
            rain3 >= 5 || maxWind > 20
              ? lang === "hi"
                ? "छिड़काव टालें — बारिश या तेज हवा दवा बहा देगी।"
                : "Delay spraying — rain or strong wind will wash the spray off."
              : lang === "hi"
                ? "छिड़काव के लिए मौसम ठीक है — सुबह 7-10 बजे के बीच करें।"
                : "Good spraying window — spray between 7 and 10 in the morning.",
        },
        {
          icon: Sprout,
          tone: "text-primary",
          text:
            maxTemp > 38
              ? lang === "hi"
                ? `तापमान ${maxTemp.toFixed(0)}°C तक — बुवाई टालें, खड़ी फसल में हल्की सिंचाई से गर्मी का असर घटाएं।`
                : `Temperature up to ${maxTemp.toFixed(0)}°C — postpone sowing and give a light irrigation to cool standing crop.`
              : lang === "hi"
                ? "बुवाई और खाद डालने के लिए मौसम अनुकूल है।"
                : "Conditions are suitable for sowing and top-dressing fertiliser.",
        },
        ...(stormy || maxWind > 30
          ? [
              {
                icon: AlertTriangle,
                tone: "text-destructive",
                text:
                  lang === "hi"
                    ? "आंधी/ओले की चेतावनी — कटी फसल ढकें और खुले में रखा अनाज सुरक्षित करें।"
                    : "Storm or hail warning — cover harvested produce and secure grain kept in the open.",
              },
            ]
          : []),
        ...(d.current.relative_humidity_2m >= 80 &&
        d.current.temperature_2m >= 20 &&
        d.current.temperature_2m <= 34
          ? [
              {
                icon: AlertTriangle,
                tone: "text-warning",
                text:
                  lang === "hi"
                    ? `नमी ${Math.round(d.current.relative_humidity_2m)}% — फफूंद रोग (रतुआ, झुलसा) और कीटों का खतरा ज्यादा। फसल का निरीक्षण करें; लक्षण दिखें तो फसल की फोटो से जांच कराएं।`
                    : `Humidity ${Math.round(d.current.relative_humidity_2m)}% — high risk of fungal disease (rust, blight) and pests. Scout the crop; photograph any spotted leaves on the Crop Analysis page.`,
              },
            ]
          : []),
        ...(rain3 >= 20
          ? [
              {
                icon: CloudRain,
                tone: "text-warning",
                text:
                  lang === "hi"
                    ? "भारी बारिश के बाद खेत में पानी खड़ा रहे तो कीटनाशक/खाद का छिड़काव बाद में करें — पहले जल निकासी करें।"
                    : "After heavy rain, drain standing water before any spray or top-dressing — waterlogged roots cannot absorb nutrients.",
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {lang === "hi" ? "खेत का मौसम" : "Farm Weather"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "hi"
              ? "अपना जिला चुनें और 7 दिन का पूर्वानुमान व सलाह देखें।"
              : "Pick your district for a live 7-day forecast and field advisories."}
          </p>
        </div>
        <select
          className="h-11 rounded-xl border border-border bg-card px-3 text-sm"
          value={locId}
          onChange={(e) => {
            setLocId(e.target.value);
            window.localStorage.setItem("sasyavedix-location", e.target.value);
          }}
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {(lang === "hi" ? l.hi : l.en) + " — " + l.state}
            </option>
          ))}
        </select>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : q.isError || !d ? (
        <div className="glass-card rounded-3xl p-6 text-sm text-destructive">
          {lang === "hi"
            ? "मौसम सेवा अभी उपलब्ध नहीं है। थोड़ी देर बाद कोशिश करें।"
            : "The weather service is unavailable right now. Please try again shortly."}
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden rounded-3xl">
            <div className="gradient-field p-6 text-primary-foreground">
              <p className="text-sm opacity-90">{lang === "hi" ? loc.hi : loc.en}</p>
              <div className="mt-1 flex items-end gap-4">
                <span className="font-display text-6xl font-bold">
                  {Math.round(d.current.temperature_2m)}°
                </span>
                <span className="pb-2 text-lg">{weatherLabel(d.current.weather_code, lang)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
              <Stat
                icon={Droplets}
                label={lang === "hi" ? "नमी" : "Humidity"}
                value={`${Math.round(d.current.relative_humidity_2m)}%`}
              />
              <Stat
                icon={Wind}
                label={lang === "hi" ? "हवा" : "Wind"}
                value={`${Math.round(d.current.wind_speed_10m)} km/h`}
              />
              <Stat
                icon={CloudRain}
                label={lang === "hi" ? "अभी वर्षा" : "Rain now"}
                value={`${d.current.precipitation} mm`}
              />
              <Stat
                icon={Thermometer}
                label={lang === "hi" ? "आज अधिकतम" : "Today max"}
                value={`${Math.round(d.daily.temperature_2m_max[0] ?? 0)}°`}
              />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5">
            <h2 className="font-display text-xl font-semibold">
              {lang === "hi" ? "7 दिन का पूर्वानुमान" : "7-day forecast"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {d.daily.time.map((day, i) => (
                <div key={day} className="rounded-2xl border border-border bg-card/60 p-3 text-center">
                  <p className="text-xs font-medium text-muted-foreground">
                    {new Date(day).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </p>
                  <Sun className="mx-auto my-2 h-5 w-5 text-accent" />
                  <p className="text-sm font-semibold">
                    {Math.round(d.daily.temperature_2m_max[i] ?? 0)}° /{" "}
                    <span className="text-muted-foreground">
                      {Math.round(d.daily.temperature_2m_min[i] ?? 0)}°
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {weatherLabel(d.daily.weather_code[i] ?? 0, lang)}
                  </p>
                  <p className="mt-1 text-xs text-primary">
                    {d.daily.precipitation_probability_max[i] ?? 0}% ·{" "}
                    {(d.daily.precipitation_sum[i] ?? 0).toFixed(1)} mm
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5">
            <h2 className="font-display text-xl font-semibold">
              {lang === "hi" ? "खेत की सलाह" : "Field advisories"}
            </h2>
            <ul className="mt-4 space-y-3">
              {advisories.map((a, i) => (
                <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card/60 p-3">
                  <a.icon className={`mt-0.5 h-5 w-5 shrink-0 ${a.tone}`} />
                  <span className="text-sm">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

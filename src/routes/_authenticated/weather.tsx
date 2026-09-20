import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({
    meta: [
      { title: "Weather — SasyaVediX" },
      { name: "description", content: "Local farm weather, rainfall and spray advisories." },
      { property: "og:title", content: "Weather — SasyaVediX" },
      { property: "og:description", content: "Farm weather forecasts for Indian districts." },
    ],
  }),
  component: () => (
    <ComingSoon
      titleKey="weather"
      bullets={[
        "7-day district forecast with rainfall probability",
        "Sowing, irrigation and spraying advisories",
        "Severe weather alerts for your village",
      ]}
    />
  ),
});

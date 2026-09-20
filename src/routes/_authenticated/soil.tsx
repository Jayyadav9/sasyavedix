import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/soil")({
  head: () => ({
    meta: [
      { title: "Soil Health — SasyaVediX" },
      { name: "description", content: "Track soil nutrients, pH and fertiliser recommendations." },
      { property: "og:title", content: "Soil Health — SasyaVediX" },
      { property: "og:description", content: "Soil nutrient tracking for your farm plots." },
    ],
  }),
  component: () => (
    <ComingSoon
      titleKey="soilHealth"
      bullets={[
        "Record soil test values for each plot",
        "N-P-K and pH interpretation in plain language",
        "Fertiliser dose recommendations per acre",
      ]}
    />
  ),
});

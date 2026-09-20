import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SasyaVediX" },
      { name: "description", content: "Price trends, best selling windows and crop comparisons." },
      { property: "og:title", content: "Analytics — SasyaVediX" },
      { property: "og:description", content: "Agricultural analytics from mandi price history." },
    ],
  }),
  component: () => (
    <ComingSoon
      titleKey="analytics"
      bullets={[
        "Crop-wise price trends and volatility",
        "Best mandi and best week to sell",
        "Compare varieties by expected revenue per acre",
      ]}
    />
  ),
});

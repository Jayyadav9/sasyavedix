import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Crop Analysis — SasyaVediX" },
      { name: "description", content: "Upload a crop photo for health analysis and price estimate." },
      { property: "og:title", content: "Crop Analysis — SasyaVediX" },
      { property: "og:description", content: "AI crop health checks from a single photo." },
    ],
  }),
  component: () => (
    <ComingSoon
      titleKey="cropAnalysis"
      bullets={[
        "Photo upload of leaf, grain or whole field",
        "Health score, disease diagnosis and treatment steps",
        "Estimated crop price based on quality and mandi rates",
      ]}
    />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — SasyaVediX" },
      { name: "description", content: "Ask farming questions in Hindi or English and get answers." },
      { property: "og:title", content: "AI Assistant — SasyaVediX" },
      { property: "og:description", content: "Your agricultural assistant in Hindi and English." },
    ],
  }),
  component: () => (
    <ComingSoon
      titleKey="aiAssistant"
      bullets={[
        "Chat in Hindi or English about crops, pests and prices",
        "Answers grounded in your farm data and mandi rates",
        "Voice-friendly short replies for field use",
      ]}
    />
  ),
});

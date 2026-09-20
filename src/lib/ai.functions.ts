import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const providerOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

const AnalysisSchema = z.object({
  crop_guess: z.string(),
  status: z.string(),
  health_score: z.number(),
  diagnosis: z.string(),
  recommendations: z.array(z.string()),
  prevention: z.array(z.string()),
  urgency: z.string(),
});

export const analyzeCropImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        imageUrl: z.string().url(),
        crop: z.string().default(""),
        lang: z.enum(["en", "hi"]).default("en"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const lovable = gateway();
    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      output: Output.object({ schema: AnalysisSchema }),
      providerOptions,
      system:
        "You are an Indian agronomist analysing a farmer's crop photo. Judge leaf colour, spots, wilting, pests and nutrient deficiency. health_score is 0-100 (100 = perfect). status is a short label like Healthy, Mild stress, Fungal infection, Pest attack, Nutrient deficiency. urgency is one of Low, Medium, High. Give 3-5 practical, low-cost recommendations naming affordable inputs available in India with dosage per acre. " +
        (data.lang === "hi"
          ? "Write every text value in simple Hindi (Devanagari)."
          : "Write every text value in simple English a smallholder farmer can follow."),
      messages: [

        {
          role: "user",
          content: [
            {
              type: "text",
              text: data.crop
                ? `This photo is of my ${data.crop} crop. What is wrong and what should I do?`
                : "What crop is this, what is wrong with it, and what should I do?",
            },
            { type: "image", image: new URL(data.imageUrl) },
          ],
        },
      ],
    });
    return await result.output;
  });

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().min(1),
        lang: z.enum(["en", "hi"]).default("en"),
        context: z.string().default(""),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const lovable = gateway();
    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      providerOptions,
      system:
        "You are SasyaVediX, an assistant for Indian smallholder farmers. Answer only farming questions: crops, varieties, sowing, irrigation, pests, fertiliser, mandi prices, government schemes, weather and selling decisions. Be short (under 150 words), concrete and practical, use ₹ and quintal/acre units, and prefer low-cost options. Ground every price, scheme and weather claim in the FARM DATA below; if the data does not cover it, say so plainly instead of inventing numbers. " +
        (data.lang === "hi" ? "Reply in simple Hindi (Devanagari)." : "Reply in simple English.") +
        `\n\nFARM DATA:\n${data.context || "(no data available)"}`,
      messages: [
        ...data.history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: data.question },
      ],
    });
    const text = await result.text;
    return { answer: text.trim() || "I could not answer that. Please ask again." };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sends a price-alert email to the signed-in user via Resend.
 * Works only when the RESEND_API_KEY secret is configured; otherwise it
 * reports configured:false so the UI can say email is not connected yet.
 */
export const sendPriceAlertEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        crop: z.string(),
        price: z.number(),
        market: z.string(),
        target: z.number(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const key = process.env["RESEND_API_KEY"];
    if (!key) return { configured: false as const, sent: false };

    const { data: userRes } = await context.supabase.auth.getUser();
    const email = userRes.user?.email;
    if (!email) return { configured: true as const, sent: false };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "SasyaVediX Alerts <alerts@sasyavedix.app>",
        to: email,
        subject: `${data.crop} hit ₹${data.price}/quintal — your alert was triggered`,
        text: `Your price alert for ${data.crop} was triggered. Best rate today: ₹${data.price}/quintal at ${data.market}. Your target was ₹${data.target}. Open SasyaVediX for details.`,
      }),
    });
    return { configured: true as const, sent: res.ok };
  });

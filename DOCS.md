# SasyaVediX — how the app is put together

"Smart Farming for Smart India" — a farmer-first agri platform: mandi prices, weather,
crop photo analysis, soil health, AI assistant, listings, buyer offers and order tracking,
in Hindi and English.

## Stack

- React + TypeScript + Vite, TanStack Router/Query, Tailwind, Recharts, Lucide
- Server logic: TanStack server functions (`src/lib/*.functions.ts`) running on the edge
- Database, auth and file storage: Lovable Cloud (Postgres with row-level security)
- AI: Lovable AI Gateway (`openai/gpt-6-astra`) for crop analysis and the assistant
- Weather: Open-Meteo (no key required)
- Live mandi prices: data.gov.in daily mandi resource (needs `DATA_GOV_IN_API_KEY`)

## Folders

```
src/routes/                 pages (file based routing)
  index.tsx                 login / signup
  _authenticated/           farmer pages (dashboard, weather, market, sell, orders,
                            analysis, soil, varieties, schemes, assistant,
                            analytics, profile)
  _authenticated/buyer/     buyer portal (browse, offers)
src/components/             app shell, soil card, shadcn ui primitives
src/lib/
  queries.ts                all TanStack Query definitions
  i18n.tsx                  Hindi/English dictionary and provider
  locations.ts              18 districts with coordinates
  soil.ts                   nutrient rating + fertiliser logic
  ai.functions.ts           analyzeCropImage, askAssistant
  mandi.functions.ts        syncMandiPrices (data.gov.in)
  ai-gateway.server.ts      AI gateway request wrapper
```

## Data model

| Table | Purpose | Access |
|---|---|---|
| `profiles` | farmer/buyer details, language | own row; buyers may read seller profiles |
| `user_roles` | `farmer` / `buyer` / `admin` | own rows, checked by `has_role()` |
| `crops`, `crop_varieties`, `schemes`, `market_prices` | reference data | readable by everyone |
| `crop_listings` | crops offered for sale | own rows; buyers see `status = 'open'` |
| `offers` | buyer bids on a listing | buyer and farmer on the offer |
| `orders` | accepted → dispatched → delivered → paid | buyer and farmer on the order |
| `crop_analysis` | AI photo results | own rows |
| `soil_tests` | lab values and dates | own rows |

Storage bucket `crop-images` is private; images are read through short-lived signed URLs.

## Server functions

| Function | Input | Output |
|---|---|---|
| `analyzeCropImage` | image URL, crop, language | status, health score, diagnosis, treatment, prevention, urgency (also saved to `crop_analysis`) |
| `askAssistant` | question, language, context, recent history | grounded answer text |
| `syncMandiPrices` | none (signed-in farmer) | `{ configured, inserted }`, upserts today's rates into `market_prices` |

## Configuration

Set at the project level, never in code:

- `LOVABLE_API_KEY` — AI gateway (already configured)
- `DATA_GOV_IN_API_KEY` — register free at data.gov.in and paste the key to switch mandi
  prices from the bundled sample history to live government rates. Until it is set,
  "Fetch today's rates" reports that the feed is not connected.

## Seed data

The database ships with 10 crops, 13 varieties, 6 central schemes and 60 days of mandi
price history for 12 crop/mandi pairs, so every chart works before any live data arrives.

## Extending it

- New AI feature: add a server function beside `ai.functions.ts`, keep prompts server-side.
- New external API: add a server function, read its key from the project secrets inside
  the handler, and cache results into a table rather than calling on every page view.
- New page: create a file under `src/routes/_authenticated/`, add a query in `queries.ts`
  and a nav entry in `src/components/app-shell.tsx` with a label in `i18n.tsx`.

## Phase 7 additions
- `msp_rates` table: 2025-26 MSP per crop (public read). Seeded data; update per season.
- `src/lib/sell-advice.ts`: rule-based sell/wait/hold advisor from price history + MSP.
- `src/lib/alert-email.functions.ts`: price-alert emails via Resend; requires `RESEND_API_KEY` secret, otherwise in-app alerts only.
- `price_alerts.notify_email`: per-alert email toggle.

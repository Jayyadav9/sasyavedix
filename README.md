# SasyaVediX 🌾

**Smart Farming for Smart India** — a full-stack agri platform that puts complex technology behind the scenes and a simple experience in front of the farmer. Built for Indian farmers and buyers: mandi prices, crop selling, weather, soil health, government schemes, and a voice assistant in Hindi and English.

**Repository**: [github.com/Jayyadav9/pixel-perfect-snapshot](https://github.com/Jayyadav9/pixel-perfect-snapshot) — kept in sync automatically with every change made here.


## What it does

**For farmers**
- **Dashboard** — today's field jobs, new offers, live local weather, onboarding checklist
- **Market Prices** — real mandi rates from data.gov.in, Government MSP 2026-27 with official source links (PIB), sell-now-or-wait advice, official links to Agmarknet, e-NAM and the Farmers' Portal
- **Sell crops** — listings with photos, quality grade, harvest date; offers from buyers; order tracking through accept → dispatch (vehicle + driver phone) → delivery → payment
- **Crop photo analysis** — upload a photo, get a health score, diagnosis and action steps (AI)
- **Soil health** — record lab results, get a printable Soil Health Card with ratings and crop-specific guidance
- **Crop calendar** — pick a sowing date, get dated irrigation / fertiliser / spray / harvest reminders per crop, per field
- **Finance** — loans (KCC), insurance policies, expenses & profit with per-acre numbers and CSV reports
- **Equipment rental** — list machines, book tractors, earnings log
- **Farmer groups** — pool quantities for bulk selling at better prices
- **Voice assistant** — ask about prices, schemes, weather or your soil; it listens and reads answers aloud in Hindi or English
- **Alerts** — price alerts above/below a target, offer and order notifications
- **Community** — post questions and tips in Hindi or English

**For buyers**
- Browse live listings with crop photos, seller trust scores and WhatsApp sharing
- Submit offers, chat with the farmer, track orders, view and print the same invoice

## Tech stack

- **Frontend**: React 19, TypeScript, TanStack Start, Tailwind CSS v4, Recharts, Lucide
- **Backend**: Lovable Cloud (Postgres with Row-Level Security), server functions, storage for crop photos
- **AI**: Lovable AI Gateway for crop photo analysis and the farmer assistant
- **Weather**: Open-Meteo live forecasts and field advisories
- **Mandi prices**: data.gov.in government feed + official MSP from PIB

## Live mandi rates setup

Market prices run on real government mandi data (data.gov.in). To connect it:

1. Register at [data.gov.in](https://www.data.gov.in) and open **My Account → API key**
2. Copy the key (format: `579b464db66ec23bdd000001…`)
3. In the app, open **Market Prices → Connect live rates** and follow the steps — or add the key as the `DATA_GOV_IN_API_KEY` secret
4. Press **Fetch today's rates** on the Market Prices page to pull fresh rates

Until the key is set, the app ships with a built-in 60-day sample price history so every screen still works.

## Project layout

- `src/routes/` — every page of the app (farmer, buyer and setup screens)
- `src/lib/` — data queries, AI functions, i18n (Hindi/English), offline cache, speech, calendar templates, location data
- `src/components/` — shared UI (app shell, notification bell, invoice, soil card)
- `DOCS.md` — full technical documentation: data model, server functions, configuration, how to extend
- `roadmap.md` — the 18 build phases and what shipped in each

## Development

```sh
npm install
npm run dev
```

Requires Node.js. The backend, database and AI gateway are configured through Lovable Cloud — no local database needed.

## Documentation

See [DOCS.md](./DOCS.md) for the data model, API surface and extension guide, and [roadmap.md](./roadmap.md) for the full phase-by-phase build history.

---

Built with [Lovable](https://lovable.dev) · सस्यवेदिक्स — खेती के लिए स्मार्ट तकनीक

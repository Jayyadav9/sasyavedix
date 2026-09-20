# SasyaVediX roadmap

## Phase 1 — done
- [x] Backend: profiles, crops, crop_varieties, market_prices (60-day history), crop_listings, crop_analysis, schemes + RLS + sample data
- [x] Email/password + Google sign-in, auto profile creation
- [x] Design system (field green / harvest gold, Baloo 2 + Mukta), Hindi/English switch
- [x] Login page, dashboard with live stats and price trend
- [x] Market prices (search, filters, sort, history mode, high/low/avg)
- [x] Sell crop listing workflow, crop varieties, government schemes

## Phase 2 — next
- [ ] Weather module (district forecast, advisories, weather cache table)
- [ ] Crop image upload + AI crop health analysis and price estimate
- [ ] Soil health module
- [ ] AI agricultural assistant (Hindi/English chat)
- [ ] Analytics (trends, best mandi, best selling window)
- [ ] Farmer profile page + onboarding (village, district, land size)
- [ ] Replace sample market data with live open API feed
- [ ] API/readme documentation

## Phase 2 — done
- Weather: live 7-day Open-Meteo forecast per selected district + irrigation/spray/sowing/storm advisories
- Crop photo analysis: private image upload, AI health score, diagnosis, treatment + prevention, saved history
- Soil health: soil test records, nutrient ratings, per-acre fertiliser recommendations, crop-specific guidance, trend chart
- AI assistant: chat grounded in mandi prices, schemes, soil test and local weather
- Analytics: price trend, mandi comparison, listings by crop, expected/sold value, activity counts

## Phase 4 — done (buyer portal + order tracking)
- Buyer sign-up/login with role, buyer portal: browse open listings with photos and mandi prices
- Offers: buyer submits price/quantity, farmer accepts or rejects
- Order tracking: accepted -> dispatched -> delivered -> paid, listing auto-marked sold
- Verified end to end in the browser with test farmer and buyer accounts

## Phase 5 — done
- Printable soil health card with ratings and advice
- Live mandi price sync from data.gov.in ("Fetch today's rates" on Market Prices)
- Farmer profile page (name, phone, village, district, state, land size, language) with
  completeness meter + dashboard onboarding prompt
- DOCS.md: stack, folders, data model, server functions, configuration, how to extend

## Open
- data.gov.in API key not supplied yet — mandi prices still use the 60-day sample history


## Phase 6 — done
- Notifications + alerts page (price alerts, offer/order notifications, bell with unread count)
- Crop calendar with sowing-to-harvest task reminders (10 crop templates)
- Payments recorded against orders + printable sale invoice (SVX invoice numbers)
- Voice: speak questions to the assistant, hear answers read aloud
- Offline: cached mandi prices, varieties and schemes with an offline badge

## Phase 7 — done
- Government data: msp_rates table seeded with 2025-26 MSP for 8 crops, public read
- Sell advisor on Market Prices: pick a crop → sell/wait/hold signal from 30-day trend
  + MSP comparison, with Hindi/English reasons
- Phone alerts: "Also email me" option on price alerts; emails sent via Resend when
  RESEND_API_KEY is configured (best effort, silent fallback to in-app only)

## Open
- data.gov.in API key not supplied — mandi prices still use the 60-day sample history
- RESEND_API_KEY not supplied — price alert emails not connected (in-app alerts work)

## Phase 8 — done
- Farmer Groups: create a group, open a bulk pool per crop, each member adds their
  quantity; pool card shows total quintal vs the best live mandi rate
- Loans & Insurance: track Kisan Credit Card / term loans (bank, sanctioned,
  outstanding, interest, due date) with a total-outstanding summary; crop insurance
  policies with premium, sum insured and claim status (enrolled/claim filed/paid)
- Scheme eligibility: every government scheme now shows an "Eligibility for you"
  check personalised to the farmer's land size and profile
- Launch prep: schemes re-seeded with richer entries (12 → 6 detailed ones with
  benefits, eligibility and official links), 8 new crop varieties, all verified
  end to end in the browser

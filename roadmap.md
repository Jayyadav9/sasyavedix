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

## Phase 9 — done
- Expenses & Profit page: per-crop costs (seed/fertiliser/diesel/labour/spray/
  irrigation), total cost vs sold value, profit and profit per acre
- Ratings & trust: both parties rate a deal (1-5 stars + note) once dispatched;
  seller trust score badge on every buyer listing ("New seller" until rated)
- Smart advisories: pest/fungal-risk warning from humidity+temperature, heavy-rain
  drainage advice added to weather page
- Yield estimates: each crop plan card shows expected quintal (variety yield x area)
  and expected income at the best current mandi rate
- Security: buyers can now only read profiles of farmers they have an offer or
  order with (was: all farmers)

## Phase 10 — done
- Record harvest on any crop plan: actual yield + date saved, "Harvested" badge
  shown next to the expected-yield estimate (verified in browser)
- Downloadable CSV reports: expenses report on Expenses & Profit, sales/orders
  report with invoice numbers on Orders
- Buyer spending summary on My Offers & Orders: orders placed, total spent,
  top crops by purchase value
- Publish still pending — user declined once; only on explicit confirmation

## Phase 11 — done
- Field-job reminders: due/overdue calendar tasks auto-create notification-bell
  entries (deduped per task, verified: bell badge lit up on the test account)
- Cost per quintal: Expenses & Profit shows true cost of production once a
  harvest is recorded (total cost ÷ actual yield), verified ₹94/q on 48 q
- Buyers can view and print the sale invoice on their orders page (same
  invoice as the farmer, seller name fetched under the deal-sharing policy)

## Phase 12 — done
- Delivery tracking on orders: dispatch now captures vehicle number and driver
  phone; dispatch/delivery dates are stamped automatically and shown on the
  order card for both farmer and buyer (verified in browser)
- Dashboard "Today on your farm" strip: field jobs due + new updates at a
  glance, linking to the calendar and alerts pages
- Demo data seeded across test accounts: listings, accepted offers, dispatched
  and paid orders, payments — so analytics, invoices, ratings and tracking all
  have realistic content
- Publish still pending — only on explicit confirmation

## Phase 13 — done
- Equipment rental marketplace: owners list machines (kind, rate/day, village, district), toggle availability, delete.
- Farmers book by start date + days; total auto-calculated; owner accepts/declines/completes, farmer can cancel.
- Notifications to owner on new booking, to farmer on accept/decline (trigger notify_booking).

## Phase 14 — done
- My Fields page: register fields (name, acres, village, district, soil type, irrigation), per-field stats (active plans, harvests, total spent)
- Crop plans and expenses can be linked to a field (optional picker in both forms)

## Phase 15 — done
- Community feed (/community): post questions/tips, reply threads, delete own posts
- In-order chat: Chat button on each order, live message thread, notifications to the other party
- Equipment earnings & usage log: per-machine earnings/bookings/days + dated usage log entries

## Phase 16 — done (hardening + polish)
- Reviews are no longer readable by every signed-in user: raw rows restricted to the
  two parties of the deal; public trust badges now use a new aggregate-only
  rating_summary() function (average + count, no identities or comments)
- Listing photos in the private bucket are only readable while the listing is open,
  by the listing owner, or by a buyer who made an offer on it
- Community page got its own page title / social preview metadata (all routes covered)
- Security scan re-run: no critical findings; remaining warnings are the expected
  SECURITY DEFINER helper/trigger functions

## Open
- data.gov.in API key not supplied — mandi prices still use the 60-day sample history
- RESEND_API_KEY not supplied — price alert emails not connected (in-app alerts work)
- Publish pending — only on explicit confirmation

## Phase 17 — done
- Installable app (PWA): manifest.webmanifest, app icons (192/512), theme color, apple touch icon, favicon replaced with SasyaVediX mark
- WhatsApp share button on every buyer listing card

## Phase 18 — done
- Real Cabinet-announced MSP 2026-27 (Rabi + Kharif) stored with official PIB source links; market page shows tappable Government MSP strip
- Official sources cards on Market Prices: Agmarknet, e-NAM, Farmers Portal MSP, data.gov.in Mandi API, PIB (EN/HI)

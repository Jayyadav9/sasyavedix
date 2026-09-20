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


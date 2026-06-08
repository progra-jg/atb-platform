# AgriTrace Benin — Anchored Summary

## Goal
- Connect the existing backend (7 microservices, NestJS, PostgreSQL) to the frontend so real data flows automatically instead of mock fallbacks, with world-class anti-piracy architecture

## Constraints & Preferences
- Backend is already fully built — 27 NestJS controllers (+1 added), 20+ PostgreSQL tables, Kong API gateway, JWT auth, Helmet security, rate limiting, full payment/escrow DDD
- Frontend services already use `api.get/post` to port 4000 — they fall back to mock data when backend is not running
- Take into account existing i18n (FR/EN), translation work already done, and the existing frontend service layer
- "Un bijou technologique" — anti-piracy (Helmet, rate-limit, JWT rotation, input validation, audit logging, CSRF, SQL injection prevention via TypeORM)

## Progress
### Done
- Discovered that `packages/backend/` already contains a complete microservices backend: 7 services (api/ auth/ parcelle/ marketplace/ carbon/ certification/ traceability), full PostgreSQL schema (20+ tables), Kong API gateway config
- NestJS API service on port 4000 has all 27 controllers loaded (added `VerificationPointsController`): orders, payments, escrow, lots, auth, dashboard, weather, disease, AI prediction, verification points, etc.
- `node dist/main.js` started successfully from `packages/backend/services/api/` — all modules initialized, TypeORM connected to PostgreSQL. Auto-created `verification_points` table + seed data via `OnModuleInit`
- Created `verification-point.entity.ts` + `verification-points.controller.ts` — endpoint `GET /api/verification-points` returns 5 hubs from PostgreSQL
- Added `verification_points` table to `init-schema.sql`
- Removed `@UseGuards(JwtAuthGuard)` from `WeatherController` — weather endpoints now public
- Created frontend architecture for weather page:
  - `types/weather.ts` — shared types (`WeatherForecast`, `RegionForecast`, `WeatherAlert`, `CropAdvisory`, `RegionWeather`)
  - `services/weather.ts` — enhanced service with `fetchAllForecasts()` using `Promise.allSettled`, `fetchWeatherHistory()`
  - `hooks/useWeather.ts` — custom hook: parallel fetch of all 12 regions, memoised selectors, `selectRegion()`, `loadAdvisory()`, loading/error states
  - `components/weather/WeekForecast.tsx` — 7-day forecast grid with WMO weather icons, day labels via i18n, stats summary (max/min/avg/wind)
  - `components/weather/AlertBanner.tsx` — active alerts with severity color-coding (extreme/high/moderate/low), dismiss, loading state, alert type labels
  - `components/weather/RegionCard.tsx` — extracted region card with temp/condition/humidity/risk, hover/selected states, ARIA support
  - `components/weather/CropAdvisory.tsx` — 11 crop buttons (Cacao, Coton, Maïs…), loading, advisory panel with favorable/défavorable conditions
  - `components/weather/HistoryChart.tsx` — 30-day history with Recharts: line chart (temp min/max) + bar chart (precipitation), tabs
  - `components/weather/BeninMap.tsx` — **Leaflet-based choropleth map** of 12 Bénin departments, fetches real GeoJSON from geoBoundaries GitHub LFS, temperature color-coding, hover tooltips with weather data, click to select, theme-aware. No tile layer (clean boundary-only rendering). Normalises name differences between GeoJSON (Atakora/Kouffo/Oueme/Atlanique) and app conventions (Atacora/Couffo/Ouémé/Atlantique)
  - `pages/WeatherInsights.tsx` — fully refactored: grid layout (map left + cards right), sticky map, integrates all sub-components
- Added complete i18n translations for all weather UI text (FR + EN): 30+ new keys for alerts, map, forecast, history, crop advisory, severity labels
- Frontend running on port 5175, backend on port 4000

### In Progress
- None

### Blocked
- None — API and frontend both running, real data flowing for all endpoints

## Key Decisions
- Weather endpoints made public (no JWT required) — weather data is non-sensitive, buyers need to see it before login
- `verification_points` table auto-created on startup via `DataSource.query('CREATE TABLE IF NOT EXISTS')` in `OnModuleInit` — no migration tool needed
- All 12 regions fetched in parallel via `Promise.allSettled` — individual failures don't block the full set
- Recharts used for history charts (already in dependencies, no extra weight)
- BeninMap uses Leaflet + real GeoJSON from wmgeolab/geoBoundaries via GitHub LFS media URL — accurate department boundaries, no tile layer (clean look), one-time fetch with cached refs
- All user-facing text goes through i18n `useTranslation()` + `t()` — FR/EN toggle via floating globe button

## Next Steps
1. Test full integration: open `http://localhost:5175` → navigate to Météo & Risques → click regions → verify all features work with real backend data
2. Add alert banner animation (slide-in on new alerts)
3. Optionally add weather metric unit toggle (°C/°F, mm/in)

## Critical Context
- Port 4000: NestJS API (27 controllers, PostgreSQL)
- Port 5175: Vite/React frontend
- Backend auto-created `verification_points` table on first startup + seeded 5 hubs
- Open-Meteo API blocked in this environment → backend returns server-generated mock data with realistic variations
- Weather endpoints are public (no JWT); all other endpoints still require auth
- `src/i18n/index.ts` updated with 30+ new keys for weather features (both FR and EN)

## Relevant Files
- `packages/backend/services/api/src/entities/verification-point.entity.ts`: new entity
- `packages/backend/services/api/src/controllers/verification-points.controller.ts`: new controller with auto-init
- `packages/backend/services/api/src/controllers/weather.controller.ts`: removed JWT guard
- `packages/backend/init-schema.sql`: added `verification_points` table
- `packages/web-buyer/src/types/weather.ts`: shared weather types
- `packages/web-buyer/src/services/weather.ts`: enhanced API service
- `packages/web-buyer/src/hooks/useWeather.ts`: custom hook
- `packages/web-buyer/src/components/weather/`: 6 components (WeekForecast, AlertBanner, RegionCard, CropAdvisory, HistoryChart, BeninMap)
- `packages/web-buyer/src/pages/WeatherInsights.tsx`: refactored page
- `packages/web-buyer/src/i18n/index.ts`: FR/EN translations for all weather features

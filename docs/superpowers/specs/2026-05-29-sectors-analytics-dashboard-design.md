# Sectors — Sector Analytics Page (Design)

**Date:** 2026-05-29
**Status:** Approved (design), pending implementation plan
**Author:** brainstormed with Claude Code

## Summary

Add a third analytics page at `/sectors` that breaks the Montenegrin company
dataset down by **sector** (the coarse `companies.sector` field), with an inline
drilldown into each sector's **activity** breakdown (the granular
`companies.activityName` / `activityCode` fields). The page mirrors the existing
`/regions` page in structure and styling — KPI strip, ranked bars, market-share
treemap, and multi-year trend lines — minus the geography, plus two
sector-specific additions: a **profit-margin** comparison and an **activity
drilldown** panel.

State (selected year, active metric, selected sector) is URL-driven, matching
`/regions` and the dashboard. No database schema changes — every number is
derived by aggregation from the existing `companies` table.

## Goals

- A new, self-contained `/sectors` page with these visualizations:
  1. Ranked bar chart — top sectors by the selected metric (clickable → drilldown).
  2. Market-share treemap — sized by **revenue** (clickable → drilldown).
  3. Profit margin by sector — bars with a national-margin reference line.
  4. Multi-year trend lines for the top sectors by the selected metric.
  5. **Activity drilldown** (full width) — `activityName` breakdown within the
     selected sector, top-N + "Other".
- A KPI strip (sectors covered, top sector by revenue, most employees, highest
  margin).
- A 4-way metric switcher: `revenue | employees | avgPay | margin`.
- Consistent look/feel with `/regions` and the dashboard (theming, fonts,
  `analytics-panel` / `control-shell` styling, dark mode).
- Shared aggregation math extracted from `regions.ts` and unit-tested, extended
  with profit margin.

## Non-Goals (YAGNI)

- No DB schema changes or migrations.
- No separate `/sectors/[sector]` route — the drilldown is an inline,
  URL-driven panel on the same page.
- No new global state management; reuse the URL-param + `useState` + refetch
  pattern already in `RegionsView.tsx`.
- No authentication or write paths (the app is read-only).
- No scale-vs-pay bubble panel in v1 (kept lean; can add later if useful).

## State & Routing

- Route: `apps/web/app/sectors/page.tsx` — an async server component that
  fetches initial data and renders a client orchestrator, mirroring
  `apps/web/app/regions/page.tsx` (`force-dynamic`, `revalidate: 300`).
- URL params:
  - `year` — default latest available year.
  - `metric` — one of `revenue | employees | avgPay | margin`; default `revenue`.
  - `sector` — optional; the sector whose activity breakdown is shown in the
    drilldown panel. When absent, the drilldown panel shows an empty/prompt state.
- The active metric drives the **ranked bars ①, trend lines ④**, and the metric
  label on the treemap. The **treemap ② is always sized by revenue** (margin is a
  ratio and can be negative, so it cannot size area; when `metric=margin` the
  treemap is clearly labeled "Market share · Revenue"). Charts ③ (margin) and ⑤
  (activity drilldown) are fixed-purpose.
- Client state changes (year/metric/sector) trigger a refetch with a loading
  flag and an error line, matching `RegionsView.tsx`.

## Navigation (shared)

- Add a **Sectors** link to `SiteNav.tsx` so the nav reads
  **Dashboard · Sectors · Regions**. No other nav changes.

## API

New aggregation module `apps/api/src/sectors.ts` and three endpoints in
`apps/api/src/index.ts`, mirroring the `/regions` endpoints.

### Shared aggregation refactor

`apps/api/src/regions.ts` currently exports `weightedAvgPay`,
`revenuePerEmployee`, `accumulateRegion`, and `RegionTotals`. Extract the
group accumulator into a shared, dimension-agnostic helper and add profit
margin:

- Rename/move `accumulateRegion` → `accumulateGroup` (same fields, plus a
  running `totalProfit` it already tracks).
- Add `profitMargin(totalProfit, totalRevenue)` →
  `totalRevenue > 0 ? totalProfit / totalRevenue : 0`.
- The accumulator's `result()` includes `profitMargin` in its output.
- `regions.ts` re-exports / consumes the shared helper so `/regions` behavior is
  unchanged. Existing `regions.test.ts` must still pass.

### Endpoints

- `GET /sectors?year=` → per-sector aggregates plus national totals.
  - Row shape: `{ sector, companyCount, totalRevenue, totalProfit,
    totalEmployees, avgPay, revenuePerEmployee, profitMargin }`.
  - `sector` null/empty coalesces to `"Other"`.
  - `national`: same totals computed across all sectors.
- `GET /sectors/activities?year=&sector=` → per-`activityName` aggregates
  **within one sector**.
  - Row shape: `{ activityName, activityCode, companyCount, totalRevenue,
    totalEmployees, avgPay, profitMargin }`.
  - Returns top-N rows by revenue (N = 12) with the remainder folded into an
    `"Other"` row. Includes the sector echoed back for the panel header.
  - Missing/unknown `sector` → empty `rows` (not an error).
- `GET /sectors/trends?metric=&limit=` → multi-year series for the top-N sectors
  by the latest-year value of `metric`, mirroring `/regions/trends`.
- Register the three routes in the `/` index route listing alongside the
  existing `/regions*` entries.

All endpoints use the existing `resolveYear`, `parsePositiveInt`,
`setHistoricalCache`, and `toNumber` helpers.

## Frontend

### Orchestrator

`apps/web/src/components/sectors/SectorsView.tsx` — client component, structured
like `RegionsView.tsx`:

- Props: `years`, `summary` (for the shared `Header`), and `initial`
  (`year`, `metric`, `sector`, `sectors`, `activities`, `trends`).
- Holds `year`, `metric`, `sector` state; syncs the URL via `router.replace`;
  refetches `/sectors`, `/sectors/trends`, and (when `sector` set)
  `/sectors/activities` on change.
- Renders the shared `Header`, a `control-shell` with the year `Select` + metric
  switcher, and the panel grid below.

### Components (`apps/web/src/components/sectors/`)

- `SectorKpiStrip` — adapt `RegionKpiStrip` (sectors covered, top sector by
  revenue, most employees, highest margin).
- `SectorRankBars` — adapt `RegionRankBars`; bars are clickable and call back
  with the sector name to set `?sector`.
- `SectorTreemap` — adapt `RegionTreemap`; **fixed to revenue**; cells clickable
  → set `?sector`.
- `SectorMarginChart` — **new**, analogous to `RegionAvgPayChart`: profit margin
  per sector with a national-margin reference line; handles negative margins.
- `SectorTrendLines` — adapt `RegionTrendLines`; YoY series by selected metric.
- `SectorActivityPanel` — **new**: horizontal bar chart (or compact table) of the
  selected sector's activities by the selected metric; empty/prompt state when no
  sector is selected; header names the selected sector.

### API client (`apps/web/src/lib/api.ts`)

Add, mirroring the region exports:

- `SectorMetric = "revenue" | "employees" | "avgPay" | "margin"`.
- `SECTOR_METRICS: { key: SectorMetric; label: string }[]`.
- `SectorRow`, `SectorsResponse`, `SectorActivityRow`, `SectorActivitiesResponse`,
  `SectorTrendsResponse` interfaces.
- `sectorMetricValue(row, metric)` and `sectorMetricToSort(metric)` helpers.
- `buildSectorParams({ year?, metric?, sector?, limit? })`.

## Data flow

1. `page.tsx` (server) resolves `year`/`metric`/`sector` from `searchParams`,
   fetches `/summary` + `/sectors` + `/sectors/trends` (+ `/sectors/activities`
   if `sector` present) in parallel, and renders `SectorsView`.
2. `SectorsView` (client) owns state, keeps the URL in sync, and refetches on
   year/metric/sector change.
3. Clicking a sector in `SectorRankBars` or `SectorTreemap` sets `sector` →
   `?sector=` → `/sectors/activities` fetch → `SectorActivityPanel` renders that
   sector's activity breakdown.

## Layout (mirrors the Regions grid)

1. Control shell: "Sectors" heading + year `Select` + metric switcher.
2. KPI strip (full width).
3. Ranked bars (top sectors by metric) | Market-share treemap (revenue).
4. Profit margin by sector (full width or paired).
5. **Activity drilldown** (full width) — updates with the selected sector.
6. Trend lines (full width).

## Error handling

- Server `page.tsx`: try/catch with a "Failed to load sectors data." fallback,
  matching `regions/page.tsx`.
- Client `SectorsView`: `loading` flag and an inline `error` line in the control
  shell, matching `RegionsView`.

## Edge cases

- **Negative profit margins** — valid for bars/lines/reference line; never used
  to size the treemap (treemap is revenue-only).
- **`"Other"` sector** — included but visually de-emphasized; null/empty sector
  coalesces to `"Other"`.
- **Zero employees** — `avgPay` / `revenuePerEmployee` guarded by the existing
  helpers (return 0).
- **Many activities in a sector** — drilldown capped at top-12 by revenue +
  `"Other"`.
- **No sector selected** — drilldown panel shows a prompt ("Select a sector to
  see its activity breakdown").

## Testing

- Extract the shared accumulator and add `profitMargin`; unit-test in
  `apps/api/src/sectors.test.ts` mirroring `regions.test.ts`
  (weighted avg pay, revenue/employee, margin incl. zero-revenue and
  negative-profit cases).
- Confirm existing `regions.test.ts` still passes after the refactor.
- `bun run build` from root for type/dependency resolution across packages.

## Open questions

None — design approved.

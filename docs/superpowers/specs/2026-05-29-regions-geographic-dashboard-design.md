# Regions — Geographic Analytics Page (Design)

**Date:** 2026-05-29
**Status:** Approved (design), pending implementation plan
**Author:** brainstormed with Claude Code

## Summary

Add a second analytics page at `/regions` that breaks the Montenegrin company
dataset down by **municipality**. The page leads with a choropleth map of
Montenegro and is followed by six supporting visualizations, all keyed on
municipality. State (selected year and active metric) is URL-driven, matching
the existing dashboard. No database schema changes — every number is derived by
aggregation from the existing `companies` table.

This is the first sibling page to the existing dashboard (`/`), so it also
introduces shared top-level navigation between the two pages.

## Goals

- A new, self-contained `/regions` page with **7 visualizations** (the user
  asked for "at least 5"):
  1. Choropleth map of Montenegro, shaded by the selected metric.
  2. Ranked bar chart — top municipalities by the selected metric.
  3. Treemap — market share by municipality.
  4. Average pay by municipality (with a national-average reference line).
  5. Bubble/scatter — x: company count, y: average pay, bubble size: revenue.
  6. Sector-mix stacked bars — sector composition within the top municipalities
     (the geography × sector tie-in).
  7. Multi-year trend lines for the top municipalities.
- A 4-card KPI strip (regions covered, top region by revenue, most companies,
  highest average pay).
- Consistent look/feel with the existing dashboard (theming, fonts,
  `analytics-panel` / `control-shell` styling, dark mode).

## Non-Goals (YAGNI)

- No DB schema changes or migrations.
- No map zoom/pan, clustering, or animated transitions in v1 (hover + shading
  only).
- No new global state management; reuse the URL-param + `useState` + debounced
  refetch pattern already in `Dashboard.tsx`.
- No authentication or write paths (the app is read-only).

## State & Routing

- Route: `apps/web/app/regions/page.tsx` — an async server component that
  fetches initial data and renders a client orchestrator, mirroring
  `apps/web/app/page.tsx`.
- URL params (consistent with the dashboard, which is already URL-driven):
  - `year` — default latest available year.
  - `metric` — one of `revenue | companies | employees | avgPay`; default
    `revenue`.
- The active metric drives the **map ①, ranked bars ②, treemap ③, and trend
  lines ⑦**. Charts ④ (avg pay), ⑤ (bubble), ⑥ (sector mix) are fixed-purpose
  and ignore the metric toggle.
- Client state changes (year/metric) trigger a refetch with a loading flag and
  an error line, matching `Dashboard.tsx`'s `isLoading` / `loadError` handling.

## Navigation (shared)

- Extract the slim top nav bar (logo + theme toggle) currently inside
  `Header.tsx` into a small client component `SiteNav` in
  `apps/web/src/components/SiteNav.tsx`.
- `SiteNav` renders two links — **Dashboard** (`/`) and **Regions**
  (`/regions`) — with active-state styling derived from `usePathname()`.
- `Header.tsx` (the dashboard hero) is refactored to render `SiteNav` at the top
  instead of its inline nav markup; its big hero/market-intelligence block is
  unchanged below the nav.
- The Regions page renders `SiteNav` plus a compact page header (title + Year and
  Metric controls) rather than duplicating the full hero.

## API (Hono — `apps/api/src/index.ts`)

Three new GET endpoints, following the existing focused-endpoint style. All
reuse the existing `resolveYear`, year-join, `normalize*`, and
`setHistoricalCache` helpers, and respect `Cache-Control` like the others.

### `GET /regions?year=YYYY`
Aggregates the selected year grouped by `municipality`.

Response:
```jsonc
{
  "year": "2025",
  "national": {
    "companyCount": 0,
    "totalRevenue": 0,
    "totalProfit": 0,
    "totalEmployees": 0,
    "avgPay": 0,            // employee-weighted national average
    "regionCount": 0        // distinct municipalities present
  },
  "municipalities": [
    {
      "municipality": "Podgorica",
      "companyCount": 0,
      "totalRevenue": 0,
      "totalProfit": 0,
      "totalEmployees": 0,
      "avgPay": 0,                 // employee-weighted within the municipality
      "revenuePerEmployee": 0      // totalRevenue / totalEmployees (0 if no employees)
    }
    // ...one row per municipality
  ]
}
```
Powers: KPI strip, map ①, ranked bars ②, treemap ③, avg-pay ④, bubble ⑤.

- `avgPay` is **employee-weighted**: `sum(averagePay * employeeCount) /
  sum(employeeCount)`, falling back to 0 when there are no employees.
- Rows with null financial fields contribute 0; rows with a null/blank
  `municipality` are excluded.

### `GET /regions/sectors?year=YYYY&limit=8`
For the top `limit` municipalities (by revenue), the revenue split by `sector`.

Response:
```jsonc
{
  "year": "2025",
  "sectors": ["Software", "Trade", "..."],   // distinct sectors, for stable stacking/legend
  "rows": [
    { "municipality": "Podgorica", "bySector": { "Software": 0, "Trade": 0 } }
    // ...
  ]
}
```
Powers: sector-mix stacked bars ⑥.

### `GET /regions/trends?metric=revenue&limit=6`
For the top `limit` municipalities (by the metric in the latest year), a series
across all available years.

Response:
```jsonc
{
  "metric": "revenue",
  "municipalities": ["Podgorica", "Budva", "..."],
  "series": [
    { "year": "2020", "values": { "Podgorica": 0, "Budva": 0 } }
    // ...one entry per year, ascending
  ]
}
```
Powers: multi-year trend lines ⑦.

A matching `metric` enum + helpers are added to `apps/web/src/lib/api.ts`
(`fetchApi`, a `buildRegionParams` helper, and TypeScript response types).

## The Map ①

- **Renderer:** `d3-geo` (`geoMercator` fitted to the feature collection +
  `geoPath`) producing plain SVG `<path>` elements that we fill based on the
  metric value. No heavyweight map framework. The SVG uses the existing
  CSS-variable palette so it themes light/dark automatically.
- **Boundary data:** a static **TopoJSON of Montenegro's ~25 municipalities**
  added at `apps/web/public/montenegro-municipalities.topo.json`, sourced from a
  public boundary dataset (e.g. geoBoundaries / GADM) and converted to TopoJSON
  to keep the payload small. Decoded client-side with `topojson-client`.
- **New dependencies:** `d3-geo`, `topojson-client` (+ their `@types`). Approved.
- **Color scale:** a sequential scale from the theme's muted surface to the
  primary teal, bucketed by metric value (quantile or linear). A small legend
  shows the scale.
- **Interaction:** hover a municipality → tooltip with its name and key stats;
  the matching ranked-bar row may highlight (nice-to-have, not required for v1).
- **Name matching:** build a normalization function (lowercase, strip
  diacritics, trim) to map DB `municipality` values to TopoJSON feature names.
  The actual DB municipality values are inspected first and an explicit override
  map handles mismatches. Municipalities present in the data but not matched to a
  shape still appear in all the chart-based panels; the map shows a small
  "N regions not shown on map" note so the gap is transparent.

## Components

New directory `apps/web/src/components/regions/`:

- `RegionsView.tsx` — client orchestrator: owns year/metric URL state, refetch
  effect, passes data to children. (Analogous to `Dashboard.tsx`.)
- `RegionKpiStrip.tsx` — the 4 KPI cards.
- `MontenegroChoropleth.tsx` — the map ① (d3-geo + SVG + tooltip + legend).
- `RegionRankBars.tsx` — ranked bars ② (Recharts).
- `RegionTreemap.tsx` — treemap ③ (wraps/reuses the existing
  `MarketShareTreemap` pattern, keyed by municipality).
- `RegionAvgPayChart.tsx` — avg pay bars ④ with national-average reference line.
- `RegionBubbleChart.tsx` — bubble/scatter ⑤ (Recharts `ScatterChart` + ZAxis).
- `RegionSectorMix.tsx` — stacked bars ⑥ (Recharts stacked `BarChart`).
- `RegionTrendLines.tsx` — multi-year lines ⑦ (Recharts `LineChart`).

Each component takes plain typed props (already-fetched data) so it can be
understood and tested in isolation.

Shared: `apps/web/src/components/SiteNav.tsx` (see Navigation).

## Error / Loading / Empty Handling

- Server component wraps initial fetch in try/catch and renders a graceful
  fallback on failure (like `app/page.tsx`).
- Client refetch on year/metric change sets a loading flag and surfaces an error
  line on failure; the previous data stays visible during refetch.
- Empty/sparse data: a municipality with no employees shows `avgPay = 0` and is
  excluded from the weighted national average's denominator contribution; the
  bubble chart omits zero-size bubbles. No NaN/Infinity reaches the UI.

## Testing

- API: each new endpoint is verified with documented `curl` checks (correct
  grouping, weighted-average math, null handling, and `limit` behavior). The
  weighted-average computation is also extracted into a helper with a unit test.
- Name-matching: a small unit test over the normalization function with the real
  set of DB municipality names vs TopoJSON names to assert full coverage (or an
  explicit, reviewed list of intentionally-unmatched names).
- Build: `bun run build` from root must pass (Turborepo dependency chain).

## Open Implementation Details (resolved during planning)

- Exact public TopoJSON source + license note.
- Whether `/regions`, `/regions/sectors`, `/regions/trends` are three calls or
  the page batches them (default: three parallel `fetchApi` calls, like the
  dashboard's `Promise.all`).
- Color-scale bucketing strategy (linear vs quantile) — decide visually during
  implementation.

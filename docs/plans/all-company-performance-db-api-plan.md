# All-Company Performance / DB / API Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make ITStats usable when expanded from a small IT-company JSON bundle to broad Montenegro company data.

**Architecture:** Stop shipping the full dataset and hundreds of thousands of static detail pages to the browser. Keep a small precomputed homepage snapshot for first paint, move large tables/search/profile history behind indexed database-backed API endpoints, and cache API responses at the edge/browser layer.

## Implementation Status

Updated: 2026-05-28

Implemented on `dev`:

- Extended the existing `companies` table with broad-company metadata (`report_id`, `legal_status`, `municipality`, `activity_code`, `activity_name`, `sector`, `parse_status`) and widened money fields to `bigint`.
- Added indexes for year/metric sorting, PIB history lookup, filters, and trigram name search in `packages/db/drizzle/0002_new_zeigeist.sql`.
- Added `scripts/import-irms-processed.ts` for processed JSONL or legacy grouped JSON imports with batched upserts on `(pib, year_id)`.
- Replaced the API with database-backed `/summary`, `/companies`, `/companies/:pib`, `/trends`, `/export.csv`, and `/years` endpoints.
- Moved dashboard table, filters, sort, pagination, trends, and CSV export to API-backed queries instead of full JSON client-side processing.
- Removed static company profile generation; profile routes now fetch one PIB history on demand.
- Fixed follow-up review issues: CSV export includes all matching rows, descending metric sorts use `NULLS LAST`, and dashboard search filtering respects debounce before API fetches.
- Ran a full-dataset performance check against a temporary local Postgres loaded from the BalkanLens Montenegro IRMS warehouse export.
- Widened `companies.name` from `varchar(256)` to `text` after the full import found 94 legal names longer than 256 characters.

Full-dataset benchmark notes:

- Source export: 291,003 Montenegro annual-financial rows from `balkanlens.duckdb.pre-me-irms-processed-20260525T1336Z.bak`.
- Imported rows after app filters: 283,032 rows, 50,028 unique PIBs, 18 years.
- Largest benchmarked years: 2024 has 35,272 rows; 2025 has 33,531 rows.
- `/summary?year=2024`: 23.3 ms median.
- `/companies?year=2024&page=1&pageSize=50&sort=totalIncome&dir=desc`: 10.5 ms median.
- `/companies?year=2024&page=100&pageSize=50&sort=totalIncome&dir=desc`: 14.2 ms median.
- `/companies?year=2024&page=1&pageSize=50&q=podgorica`: 14.6 ms median, 11,547 matches.
- `/trends?year=2024&metric=totalIncome`: 5.7 ms median.
- `/companies/02440261`: 0.4 ms median, 12 history rows.
- `/export.csv?year=2024&sort=totalIncome&dir=desc`: 101.6 ms median, 35,273 CSV rows including header, 4.9 MB response.
- Worst-case spot checks: final 2024 page was 41.3 ms, `pageSize=200` was 12.6 ms, no-result search was 15.1 ms, filtered summary for `q=podgorica` was 54.0 ms, and 2025 full CSV export was 106.6 ms.

Not implemented yet:

- Optional `/companies/:pib/summary` endpoint.
- SWR/TanStack Query integration; current frontend uses direct typed fetch helpers.
- Materialized summary tables or measured CDN/edge cache rollout.

**Current observed bottlenecks:**
- `backups/companies.json` is already 42.3 MiB for 6 years, 71,871 year/company rows, 30,579 unique companies.
- `apps/web/out` is 1.9 GiB with 262,137 files after static export.
- `apps/web/.next` is 3.5 GiB.
- Homepage imports `backups/companies.json` directly through `apps/web/src/lib/company-data.ts`, so the app bundle/data graph grows with the dataset.
- `generateStaticParams()` in `apps/web/app/company/[companyName]/page.tsx` emits a page per PIB. That does not scale for broad CRPS/IRMS coverage.
- `CompanyPage` scans `companyData.flatMap(...find...)` across all years on the client for a single profile.
- `CompanyTable` renders all filtered rows and sorts them client-side; this will get slow when one year expands materially beyond the current ~30k companies.

---

## Target design

### Data model

Use Postgres as the source for the app, with one row per company/year statement.

Suggested tables/indexes:

```sql
create table company_year_metrics (
  pib text not null,
  year int not null,
  report_id text,
  name text not null,
  legal_status text,
  municipality text,
  activity_code text,
  activity_name text,
  sector text not null,
  total_income bigint,
  profit bigint,
  employee_count int,
  net_pay_costs bigint,
  average_pay int,
  income_per_employee bigint,
  parse_status text,
  updated_at timestamptz not null default now(),
  primary key (pib, year)
);

create index company_year_metrics_year_income_idx
  on company_year_metrics (year, total_income desc nulls last);

create index company_year_metrics_year_profit_idx
  on company_year_metrics (year, profit desc nulls last);

create index company_year_metrics_year_employees_idx
  on company_year_metrics (year, employee_count desc nulls last);

create index company_year_metrics_pib_year_idx
  on company_year_metrics (pib, year desc);

create index company_year_metrics_filters_idx
  on company_year_metrics (year, sector, municipality, activity_code);

create extension if not exists pg_trgm;
create index company_year_metrics_name_trgm_idx
  on company_year_metrics using gin (name gin_trgm_ops);
```

Keep derived values (`sector`, `income_per_employee`) materialized on import so API queries stay simple.

### API shape

Add/replace endpoints in `apps/api/src/index.ts`:

- `GET /summary?year=2024`
  - Returns total revenue, total employees, company count, concentration stats, available years, filter option counts.
  - Cache key: year + clean-data-version.

- `GET /companies?year=2024&sort=totalIncome&dir=desc&page=1&pageSize=50&sector=Technology&municipality=Podgorica&q=...`
  - Returns paginated company rows plus `total`.
  - Sort and filters executed in SQL.
  - Default `pageSize` 50, max 200.

- `GET /companies/:pib`
  - Returns all historical rows for that PIB ordered by year.
  - This replaces statically generating every profile route.

- `GET /companies/:pib/summary`
  - Optional compact endpoint for profile KPI cards if profile page needs faster first paint.

- `GET /trends?metric=totalIncome&companyPibs=...`
  - Optional endpoint for selected-company comparison charts.

- `GET /export.csv?...filters...`
  - Server-side streaming CSV export for the filtered result set. Do not build giant CSVs in the browser.

### Frontend shape

Switch `apps/web/next.config.mjs` away from static export for production if using Next server routes/API proxying. If keeping a split Hono API + static web, still remove all-company static params and fetch data from Hono.

Recommended UI changes:

1. `apps/web/app/page.tsx`
   - Load only a compact initial snapshot, not full `companyData`.
   - Use API calls for table pages and charts.

2. `apps/web/src/components/Dashboard.tsx`
   - Store filters in URL as it already does.
   - Replace local `filterCompanies`, local full-list reductions, and local all-row sorting with API query state.
   - Use debounce for text search.

3. `apps/web/src/components/CompanyTable.tsx`
   - Add pagination controls.
   - Render only current API page.
   - Optional later: virtualize with `@tanstack/react-virtual` if page sizes >200 are desired.

4. `apps/web/app/company/[companyName]/page.tsx`
   - Remove `generateStaticParams()` and `dynamicParams = false`.
   - Treat route param as PIB.
   - Fetch `/companies/:pib` on demand.

5. `apps/web/src/components/CompanyPage.tsx`
   - Accept fetched `history` as props or fetch through a client query hook.
   - Do not import/scan all `companyData`.

### Caching

Use layered caching:

- Import-time cache/materialization:
  - `sector`, normalized legal status, cleaned activity code/name.
  - Optional materialized summary table keyed by year.

- API headers:
  - For mostly immutable historical data: `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`.
  - For latest in-progress year if ever enabled: much shorter TTL.

- Browser/client:
  - Use SWR or TanStack Query for `/summary`, `/companies`, `/companies/:pib`.
  - Query key includes filters, sort, page.
  - Keep previous page data while fetching next page.

- CDN/Railway edge/proxy:
  - Cache GETs by full URL for immutable years.

### Import pipeline

Source from `scraping-eprijava/data/irms/processed*/companies_latest_partial.jsonl` / statements JSONL rather than `backups/companies.json`.

Importer requirements:
- Bulk load with `COPY` or batched inserts, not row-by-row inserts.
- Upsert on `(pib, year)`.
- Exclude `Preduzetnik` by default.
- Exclude `average_pay < 300` from default public dataset.
- Exclude current/future years by default (`maxPeriodYear = current year - 1`) unless explicitly enabled.
- Preserve `parse_status` for audit views.

---

## Bite-sized implementation tasks

### Task 1: Add DB schema fields and indexes

**Objective:** Make existing DB schema match broad company records and query patterns.

**Files:**
- Modify: `packages/db/src/schema.ts`
- Create migration through existing Drizzle workflow.

**Steps:**
1. Add `legalStatus`, `municipality`, `activityCode`, `activityName`, `sector`, `reportId`, `parseStatus` columns.
2. Change money columns to `bigint`/numeric-safe representation if current `integer` is too small for broad revenue values.
3. Add indexes from the target design.
4. Run `bun run --filter db generate`.
5. Run TypeScript build for `packages/db`.

### Task 2: Replace row-by-row importer with bulk importer

**Objective:** Load broad IRMS output into Postgres quickly and repeatably.

**Files:**
- Replace or add: `scripts/import-irms-processed.ts`
- Keep old `scripts/import-data.ts` only if needed for legacy.

**Steps:**
1. Read JSONL/CSV from `../scraping-eprijava/data/irms/processed*/...` path passed as CLI argument.
2. Normalize legal status/activity/sector using the same rules currently in `apps/web/src/lib/company-filters.ts`.
3. Write temp CSV and load with `COPY` or batched `INSERT ... ON CONFLICT`.
4. Verify counts by year after import.

### Task 3: Build paginated API endpoints

**Objective:** Stop returning the whole dataset from `/companies`.

**Files:**
- Modify: `apps/api/src/index.ts`

**Steps:**
1. Add parameter parsing helpers for year/page/pageSize/sort/filters/search.
2. Add `GET /summary`.
3. Replace `GET /companies` with paginated SQL query and `count(*) over()` or separate count query.
4. Keep `GET /companies/:pib` but ensure it is indexed and returns only one PIB history.
5. Add cache headers.

### Task 4: Remove static profile generation

**Objective:** Avoid generating hundreds of thousands of files.

**Files:**
- Modify: `apps/web/app/company/[companyName]/page.tsx`
- Modify: `apps/web/next.config.mjs`

**Steps:**
1. Remove `companyPibs` import.
2. Delete `generateStaticParams()` and `dynamicParams = false`.
3. Treat param as PIB and fetch profile data on demand.
4. If web remains static-only, use a client fetch in `CompanyPage`; if web becomes server-rendered, fetch in the page component.

### Task 5: Make dashboard API-driven

**Objective:** Avoid loading and sorting/filtering the full JSON in the browser.

**Files:**
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/src/components/Dashboard.tsx`
- Modify: `apps/web/src/components/CompanyTable.tsx`

**Steps:**
1. Replace `companyData` prop with initial `/summary` and initial `/companies` page.
2. Move filter/sort/page into a typed query object derived from URL search params.
3. Fetch company page data whenever query changes.
4. Render table rows from API response only.
5. Add pagination UI and loading/error states.

### Task 6: Server-side CSV export

**Objective:** Export broad filtered views without building giant CSVs in the browser.

**Files:**
- Modify: `apps/api/src/index.ts`
- Modify: `apps/web/src/components/Dashboard.tsx`

**Steps:**
1. Add `GET /export.csv` with the same filters/sort as `/companies`.
2. Stream rows or cap export with a clear limit.
3. Change frontend export button to navigate to the API URL.

### Task 7: Performance verification

**Objective:** Prove the broad dataset is fast enough.

**Checks:**
- Build size: `.next`/`out` should drop sharply because all-company static pages are gone.
- Homepage first load should not include a 42+ MiB JSON payload.
- `/companies?year=2024&pageSize=50` should respond sub-300ms locally after warm DB.
- `/companies/:pib` should respond sub-100ms locally for indexed lookup.
- Browser profile page should fetch only one company history, not all company years.

**Commands:**
```bash
bun run --filter api build
bun run --filter web lint
bun run --filter web build
```

---

## Immediate recommendation

Do not keep trying to optimize the static-export/all-JSON model. The current 42 MiB JSON and 1.9 GiB export are already over the line. The highest-leverage first PR is:

1. Remove all static company page generation.
2. Introduce paginated `/companies` and `/companies/:pib` API usage.
3. Keep only summary/top-N snapshot on the homepage.

That preserves the current UI while changing the data path to something that can handle full Montenegro coverage.

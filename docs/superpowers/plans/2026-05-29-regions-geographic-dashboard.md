# Regions Geographic Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/regions` page that breaks the company dataset down by municipality with a Montenegro choropleth map plus six supporting visualizations.

**Architecture:** Three new focused Hono endpoints aggregate the existing `companies` table by `municipality`. A new Next.js App Router page (`/regions`) fetches them and renders isolated React components (Recharts for charts, `d3-geo` + plain SVG for the map). Year/metric are URL-driven, matching the dashboard. Shared top navigation is extracted into `SiteNav`.

**Tech Stack:** Next.js 16 (App Router), React 19, Recharts 3, `d3-geo`, Hono on Bun, Drizzle, Tailwind v4 with CSS-variable theming. Tests via `bun test` (`bun:test`).

**Spec:** `docs/superpowers/specs/2026-05-29-regions-geographic-dashboard-design.md`

**Environment notes:**
- The Supabase DB may be unreachable from CI/sandbox; live data checks run on a machine with a working `packages/db/.env`. Pure-logic tests (`bun test`) and `bun run build` must pass everywhere.
- Distinct municipality strings come from the API: `GET /summary` → `filterOptions.municipalities[].value`. Use this list to verify map name-matching.
- Map shading uses `hsl(var(--primary))` opacity ramps so it themes automatically.

---

## Task 1: Add map dependency

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add d3-geo**

Run from repo root:
```bash
bun add --cwd apps/web d3-geo
bun add --cwd apps/web -d @types/d3-geo
```
(We render GeoJSON directly with `d3-geo`; no `topojson-client` needed — simpler, one fewer dep. `d3-scale` is already present for color ramps.)

- [ ] **Step 2: Verify install**

Run: `grep d3-geo apps/web/package.json`
Expected: `d3-geo` in dependencies and `@types/d3-geo` in devDependencies.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json bun.lock
git commit -m "Add d3-geo dependency for regions map"
```

---

## Task 2: Region aggregation helper + unit test (API)

**Files:**
- Create: `apps/api/src/regions.ts`
- Create: `apps/api/src/regions.test.ts`

The math that needs testing is the employee-weighted average pay and revenue-per-employee reducers. Extract them as pure functions.

- [ ] **Step 1: Write the failing test** — `apps/api/src/regions.test.ts`

```ts
import { describe, expect, test } from 'bun:test';
import { weightedAvgPay, revenuePerEmployee, accumulateRegion } from './regions';

describe('region aggregation math', () => {
  test('weightedAvgPay weights by employees', () => {
    // 10 employees @ 1000, 90 employees @ 2000 => 1900
    expect(weightedAvgPay(1000 * 10 + 2000 * 90, 100)).toBe(1900);
  });

  test('weightedAvgPay is 0 with no employees', () => {
    expect(weightedAvgPay(0, 0)).toBe(0);
  });

  test('revenuePerEmployee divides revenue by employees', () => {
    expect(revenuePerEmployee(1_000_000, 50)).toBe(20_000);
  });

  test('revenuePerEmployee is 0 with no employees', () => {
    expect(revenuePerEmployee(1_000_000, 0)).toBe(0);
  });

  test('accumulateRegion sums financials and pay-weight, ignores nulls', () => {
    const acc = accumulateRegion();
    acc.add({ totalIncome: 100, profit: 10, employeeCount: 5, averagePay: 200 });
    acc.add({ totalIncome: null, profit: null, employeeCount: null, averagePay: null });
    acc.add({ totalIncome: 50, profit: -5, employeeCount: 5, averagePay: 400 });
    const r = acc.result();
    expect(r.totalRevenue).toBe(150);
    expect(r.totalProfit).toBe(5);
    expect(r.totalEmployees).toBe(10);
    expect(r.companyCount).toBe(3);
    expect(r.avgPay).toBe(300); // (200*5 + 400*5)/10
    expect(r.revenuePerEmployee).toBe(15); // 150/10
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

Run: `cd apps/api && bun test src/regions.test.ts`
Expected: FAIL (module/exports missing).

- [ ] **Step 3: Implement `apps/api/src/regions.ts`**

```ts
export function weightedAvgPay(payWeightSum: number, employees: number): number {
  return employees > 0 ? Math.round(payWeightSum / employees) : 0;
}

export function revenuePerEmployee(revenue: number, employees: number): number {
  return employees > 0 ? Math.round(revenue / employees) : 0;
}

type CompanyAgg = {
  totalIncome: number | null;
  profit: number | null;
  employeeCount: number | null;
  averagePay: number | null;
};

export type RegionTotals = {
  companyCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalEmployees: number;
  avgPay: number;
  revenuePerEmployee: number;
};

export function accumulateRegion() {
  let companyCount = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalEmployees = 0;
  let payWeightSum = 0; // sum(averagePay * employeeCount)

  return {
    add(c: CompanyAgg) {
      companyCount += 1;
      totalRevenue += c.totalIncome ?? 0;
      totalProfit += c.profit ?? 0;
      const emp = c.employeeCount ?? 0;
      totalEmployees += emp;
      if (c.averagePay != null && emp > 0) payWeightSum += c.averagePay * emp;
    },
    result(): RegionTotals {
      return {
        companyCount,
        totalRevenue,
        totalProfit,
        totalEmployees,
        avgPay: weightedAvgPay(payWeightSum, totalEmployees),
        revenuePerEmployee: revenuePerEmployee(totalRevenue, totalEmployees),
      };
    },
  };
}
```

- [ ] **Step 4: Run it — expect PASS**

Run: `cd apps/api && bun test src/regions.test.ts`
Expected: 5 pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/regions.ts apps/api/src/regions.test.ts
git commit -m "Add region aggregation helpers with tests"
```

---

## Task 3: API endpoints `/regions`, `/regions/sectors`, `/regions/trends`

**Files:**
- Modify: `apps/api/src/index.ts`

Add after the `/trends` handler. Reuse `resolveYear`, `availableYears`, `companies`, `years`, `eq`, `and`, `sql`, `asc`, `desc`, `db`, `setHistoricalCache`, `parsePositiveInt`, `parseSort`, `toNumber`, `toNumberOrNull`. Aggregate in SQL where cheap; do weighted pay in JS via Task 2 helpers when grouping by raw rows.

- [ ] **Step 1: Add imports**

At top of `index.ts`, extend the `from 'db'` import to include `isNotNull`, and import the helper:
```ts
import { accumulateRegion } from './regions';
```
Add `isNotNull` to the existing `db` import list (it is exported from drizzle-orm via the `db` package barrel — confirm with `grep "isNotNull" packages/db/src/index.ts`; if absent, add `export { isNotNull } from 'drizzle-orm';` there).

- [ ] **Step 2: `/regions` handler**

```ts
app.get('/regions', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const yearValue = await resolveYear(searchParams.get('year'));
    const rows = await db
      .select({
        municipality: companies.municipality,
        companyCount: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
        totalProfit: sql<string>`coalesce(sum(${companies.profit}),0)`,
        totalEmployees: sql<string>`coalesce(sum(${companies.employeeCount}),0)`,
        payWeight: sql<string>`coalesce(sum(${companies.averagePay}::bigint * coalesce(${companies.employeeCount},0)),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, yearValue), isNotNull(companies.municipality)))
      .groupBy(companies.municipality)
      .orderBy(sql`coalesce(sum(${companies.totalIncome}),0) desc`);

    const municipalities = rows
      .filter((r) => r.municipality && r.municipality.trim())
      .map((r) => {
        const totalRevenue = toNumber(r.totalRevenue);
        const totalEmployees = toNumber(r.totalEmployees);
        const payWeight = toNumber(r.payWeight);
        return {
          municipality: r.municipality!.trim(),
          companyCount: Number(r.companyCount),
          totalRevenue,
          totalProfit: toNumber(r.totalProfit),
          totalEmployees,
          avgPay: totalEmployees > 0 ? Math.round(payWeight / totalEmployees) : 0,
          revenuePerEmployee: totalEmployees > 0 ? Math.round(totalRevenue / totalEmployees) : 0,
        };
      });

    const national = municipalities.reduce(
      (acc, m) => {
        acc.companyCount += m.companyCount;
        acc.totalRevenue += m.totalRevenue;
        acc.totalProfit += m.totalProfit;
        acc.totalEmployees += m.totalEmployees;
        acc.payWeight += m.avgPay * m.totalEmployees;
        return acc;
      },
      { companyCount: 0, totalRevenue: 0, totalProfit: 0, totalEmployees: 0, payWeight: 0 },
    );

    setHistoricalCache(c);
    return c.json({
      year: String(yearValue),
      national: {
        companyCount: national.companyCount,
        totalRevenue: national.totalRevenue,
        totalProfit: national.totalProfit,
        totalEmployees: national.totalEmployees,
        avgPay: national.totalEmployees > 0 ? Math.round(national.payWeight / national.totalEmployees) : 0,
        regionCount: municipalities.length,
      },
      municipalities,
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return c.json({ error: 'Failed to fetch regions' }, 500);
  }
});
```

- [ ] **Step 3: `/regions/sectors` handler**

```ts
app.get('/regions/sectors', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const yearValue = await resolveYear(searchParams.get('year'));
    const limit = parsePositiveInt(searchParams.get('limit'), 8, 25);

    const topRows = await db
      .select({
        municipality: companies.municipality,
        rev: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, yearValue), isNotNull(companies.municipality)))
      .groupBy(companies.municipality)
      .orderBy(sql`coalesce(sum(${companies.totalIncome}),0) desc`)
      .limit(limit);

    const topNames = topRows.map((r) => r.municipality!).filter(Boolean);
    if (topNames.length === 0) {
      setHistoricalCache(c);
      return c.json({ year: String(yearValue), sectors: [], rows: [] });
    }

    const sectorRows = await db
      .select({
        municipality: companies.municipality,
        sector: companies.sector,
        rev: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, yearValue), inArray(companies.municipality, topNames)))
      .groupBy(companies.municipality, companies.sector);

    const sectorSet = new Set<string>();
    const byMun = new Map<string, Record<string, number>>();
    for (const r of sectorRows) {
      const mun = r.municipality!.trim();
      const sector = (r.sector ?? 'Other').trim() || 'Other';
      sectorSet.add(sector);
      const bucket = byMun.get(mun) ?? {};
      bucket[sector] = (bucket[sector] ?? 0) + toNumber(r.rev);
      byMun.set(mun, bucket);
    }

    setHistoricalCache(c);
    return c.json({
      year: String(yearValue),
      sectors: Array.from(sectorSet).sort(),
      rows: topNames.map((mun) => ({ municipality: mun.trim(), bySector: byMun.get(mun.trim()) ?? {} })),
    });
  } catch (error) {
    console.error('Error fetching region sectors:', error);
    return c.json({ error: 'Failed to fetch region sectors' }, 500);
  }
});
```
(`inArray` is already imported in `index.ts`.)

- [ ] **Step 4: `/regions/trends` handler**

```ts
app.get('/regions/trends', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const metric = parseSort(searchParams.get('metric')); // reuse SortKey; 'totalIncome' default
    const limit = parsePositiveInt(searchParams.get('limit'), 6, 12);
    const allYears = await availableYears();
    const latest = allYears[0];
    const metricCol =
      metric === 'employeeCount' ? companies.employeeCount
      : metric === 'profit' ? companies.profit
      : metric === 'averagePay' ? companies.averagePay
      : companies.totalIncome;

    const topRows = await db
      .select({
        municipality: companies.municipality,
        v: sql<string>`coalesce(sum(${metricCol}),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, latest), isNotNull(companies.municipality)))
      .groupBy(companies.municipality)
      .orderBy(sql`coalesce(sum(${metricCol}),0) desc`)
      .limit(limit);

    const topNames = topRows.map((r) => r.municipality!).filter(Boolean);
    if (topNames.length === 0) {
      setHistoricalCache(c);
      return c.json({ metric, municipalities: [], series: [] });
    }

    const rows = await db
      .select({
        year: years.yearValue,
        municipality: companies.municipality,
        v: sql<string>`coalesce(sum(${metricCol}),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(inArray(companies.municipality, topNames))
      .groupBy(years.yearValue, companies.municipality)
      .orderBy(asc(years.yearValue));

    const byYear = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const y = String(r.year);
      const bucket = byYear.get(y) ?? {};
      bucket[r.municipality!.trim()] = toNumber(r.v);
      byYear.set(y, bucket);
    }

    setHistoricalCache(c);
    return c.json({
      metric,
      municipalities: topNames.map((n) => n.trim()),
      series: Array.from(byYear.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([year, values]) => ({ year, values })),
    });
  } catch (error) {
    console.error('Error fetching region trends:', error);
    return c.json({ error: 'Failed to fetch region trends' }, 500);
  }
});
```

- [ ] **Step 5: Typecheck the API**

Run: `cd apps/api && bunx tsc -p tsconfig.json --noEmit`
Expected: no errors. (If `isNotNull` is missing from the `db` barrel, add the re-export per Step 1.)

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/index.ts packages/db/src/index.ts
git commit -m "Add /regions, /regions/sectors, /regions/trends endpoints"
```

---

## Task 4: Web API client types & helpers

**Files:**
- Modify: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Append types + metric union + param builder**

```ts
export type RegionMetric = "revenue" | "companies" | "employees" | "avgPay";

export const REGION_METRICS: { key: RegionMetric; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "companies", label: "Companies" },
  { key: "employees", label: "Employees" },
  { key: "avgPay", label: "Avg pay" },
];

export interface RegionRow {
  municipality: string;
  companyCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalEmployees: number;
  avgPay: number;
  revenuePerEmployee: number;
}

export interface RegionsResponse {
  year: string;
  national: {
    companyCount: number;
    totalRevenue: number;
    totalProfit: number;
    totalEmployees: number;
    avgPay: number;
    regionCount: number;
  };
  municipalities: RegionRow[];
}

export interface RegionSectorsResponse {
  year: string;
  sectors: string[];
  rows: { municipality: string; bySector: Record<string, number> }[];
}

export interface RegionTrendsResponse {
  metric: string;
  municipalities: string[];
  series: { year: string; values: Record<string, number> }[];
}

// Map a RegionMetric to the numeric field on RegionRow
export function regionMetricValue(row: RegionRow, metric: RegionMetric): number {
  switch (metric) {
    case "companies": return row.companyCount;
    case "employees": return row.totalEmployees;
    case "avgPay": return row.avgPay;
    default: return row.totalRevenue;
  }
}

// metric -> the API SortKey used by /regions/trends
export function regionMetricToSort(metric: RegionMetric): CompanySortKey {
  switch (metric) {
    case "employees": return "employeeCount";
    case "avgPay": return "averagePay";
    case "companies": return "totalIncome"; // companies count not a sort col; trend falls back to revenue
    default: return "totalIncome";
  }
}

export function buildRegionParams(opts: { year?: string; metric?: RegionMetric; limit?: number }) {
  const params = new URLSearchParams();
  appendDefined(params, "year", opts.year);
  if (opts.metric) appendDefined(params, "metric", regionMetricToSort(opts.metric));
  appendDefined(params, "limit", opts.limit);
  return params;
}
```

- [ ] **Step 2: Typecheck**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: no new errors (pre-existing ones, if any, unchanged).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/api.ts
git commit -m "Add region API response types and helpers"
```

---

## Task 5: Montenegro GeoJSON asset + name-matching util

**Files:**
- Create: `apps/web/public/montenegro-municipalities.json` (GeoJSON FeatureCollection)
- Create: `apps/web/src/lib/regions-geo.ts`
- Create: `apps/web/src/lib/regions-geo.test.ts`

- [ ] **Step 1: Fetch boundary data**

Run:
```bash
curl -fsSL -o apps/web/public/montenegro-municipalities.json \
  https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/MNE/ADM1/geoBoundaries-MNE-ADM1.geojson
```
Verify it parses and inspect the feature name property:
```bash
node -e "const g=require('./apps/web/public/montenegro-municipalities.json'); console.log('features', g.features.length); console.log(g.features.slice(0,3).map(f=>f.properties.shapeName))"
```
Expected: ~24 features; `shapeName` holds municipality names (e.g. "Podgorica", "Nikšić"). If the URL is unavailable, use the geoBoundaries API to resolve `gjDownloadURL`:
`curl -fsSL https://www.geoboundaries.org/api/current/gbOpen/MNE/ADM1/ | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).gjDownloadURL))"`
then curl that URL to the same path.

- [ ] **Step 2: Write the failing test** — `apps/web/src/lib/regions-geo.test.ts`

```ts
import { describe, expect, test } from "bun:test";
import { normalizeMunicipality, matchRegionName } from "./regions-geo";

describe("municipality normalization", () => {
  test("strips diacritics and lowercases", () => {
    expect(normalizeMunicipality("Nikšić")).toBe("niksic");
    expect(normalizeMunicipality("ŽABLJAK")).toBe("zabljak");
    expect(normalizeMunicipality("  Bijelo Polje ")).toBe("bijelo polje");
  });

  test("matchRegionName maps data name to a geo feature name", () => {
    const geoNames = ["Podgorica", "Nikšić", "Herceg Novi", "Bijelo Polje"];
    expect(matchRegionName("PODGORICA", geoNames)).toBe("Podgorica");
    expect(matchRegionName("Herceg-Novi", geoNames)).toBe("Herceg Novi");
    expect(matchRegionName("Unknownville", geoNames)).toBeNull();
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

Run: `cd apps/web && bun test src/lib/regions-geo.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 4: Implement `apps/web/src/lib/regions-geo.ts`**

```ts
// Normalize a municipality string for matching: lowercase, strip diacritics,
// collapse separators/whitespace.
export function normalizeMunicipality(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritics
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// Explicit overrides for known spelling mismatches between the dataset and the
// geoBoundaries shapeName values. Fill in after Step 1 / API enumeration.
// key = normalized data value, value = exact geo feature name.
const OVERRIDES: Record<string, string> = {
  // "savnik": "Šavnik", (geo already matches via normalization in most cases)
};

// Given a data municipality value and the list of geo feature names, return the
// exact geo name it matches, or null if unmatched.
export function matchRegionName(dataName: string, geoNames: string[]): string | null {
  const norm = normalizeMunicipality(dataName);
  if (OVERRIDES[norm]) return OVERRIDES[norm];
  const hit = geoNames.find((g) => normalizeMunicipality(g) === norm);
  return hit ?? null;
}
```

- [ ] **Step 5: Run — expect PASS**

Run: `cd apps/web && bun test src/lib/regions-geo.test.ts`
Expected: pass.

- [ ] **Step 6: Verify coverage against real data (manual, where API reachable)**

Run the API and:
```bash
curl -s "http://localhost:3000/summary" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const m=JSON.parse(s).filterOptions.municipalities.map(x=>x.value);console.log(m)})"
```
Compare to `shapeName`s; add any mismatches to `OVERRIDES`. Acceptable to leave rare/unknown values unmatched (they appear in charts, not the map).

- [ ] **Step 7: Commit**

```bash
git add apps/web/public/montenegro-municipalities.json apps/web/src/lib/regions-geo.ts apps/web/src/lib/regions-geo.test.ts
git commit -m "Add Montenegro boundary data and municipality name-matching"
```

---

## Task 6: SiteNav extraction + Header refactor

**Files:**
- Create: `apps/web/src/components/SiteNav.tsx`
- Modify: `apps/web/src/components/Header.tsx:41-77` (replace inline `<nav>`)

- [ ] **Step 1: Create `SiteNav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleStackIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/regions", label: "Regions" },
];

export function SiteNav({ showMeta = true }: { showMeta?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="control-shell flex min-h-14 items-center justify-between overflow-hidden">
      <div className="flex min-w-0 items-center">
        <Link href="/" className="flex min-w-0 items-center gap-3 px-3 py-2 sm:px-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card text-primary shadow-sm">
            <span className="font-display text-xl font-bold leading-none">M</span>
          </span>
          <span className="block truncate font-display text-2xl font-bold leading-none text-foreground">
            MNEStats.me
          </span>
        </Link>
        <div className="ml-1 hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="hidden h-14 items-center justify-end divide-x divide-border/80 lg:flex">
        {showMeta && (
          <div className="flex items-center gap-2 px-5 text-xs text-muted-foreground">
            <CircleStackIcon className="h-4 w-4 text-primary" />
            <span>Data source: Central Register of Business Entities (CRPS)</span>
            <InformationCircleIcon className="h-4 w-4" />
          </div>
        )}
        <div className="px-3">
          <ThemeToggle className="h-10 w-10 rounded-md border-border/80 bg-background/45" />
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 lg:hidden">
        <ThemeToggle className="h-10 w-10 rounded-md border-border/80 bg-background/45" />
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Use it in `Header.tsx`**

Add `import { SiteNav } from "./SiteNav";` and replace the existing `<nav className="control-shell ...">...</nav>` block (lines ~41-77) with:
```tsx
<SiteNav />
```
Leave the hero `<div className="grid gap-8 ...">` block and below unchanged. Remove now-unused icon imports from `Header.tsx` if they become unused (`CircleStackIcon`, `InformationCircleIcon`); keep `ArrowPathIcon`, `BuildingOffice2Icon` (still used in the mobile chip).

- [ ] **Step 3: Typecheck + lint**

Run: `cd apps/web && bunx tsc --noEmit && bun run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/SiteNav.tsx apps/web/src/components/Header.tsx
git commit -m "Extract shared SiteNav with Dashboard/Regions navigation"
```

---

## Task 7: Presentational region components

**Files (create all under `apps/web/src/components/regions/`):**
- `RegionKpiStrip.tsx`, `RegionRankBars.tsx`, `RegionTreemap.tsx`, `RegionAvgPayChart.tsx`, `RegionBubbleChart.tsx`, `RegionSectorMix.tsx`, `RegionTrendLines.tsx`

All are pure presentational components taking typed props. Use Recharts `ResponsiveContainer`; colors from CSS vars (`hsl(var(--primary))`, `hsl(var(--chart-N))`). Wrap each in the existing card styles (`analytics-panel border-border/80 bg-card/90 rounded-md`).

- [ ] **Step 1: `RegionKpiStrip.tsx`**

```tsx
"use client";
import numeral from "numeral";
import type { RegionsResponse, RegionRow } from "@/lib/api";

const top = (rows: RegionRow[], by: (r: RegionRow) => number) =>
  rows.reduce<RegionRow | null>((best, r) => (!best || by(r) > by(best) ? r : best), null);

export function RegionKpiStrip({ data }: { data: RegionsResponse }) {
  const rows = data.municipalities;
  const topRevenue = top(rows, (r) => r.totalRevenue);
  const topCompanies = top(rows, (r) => r.companyCount);
  const topPay = top(rows.filter((r) => r.totalEmployees >= 10), (r) => r.avgPay) ?? top(rows, (r) => r.avgPay);
  const cards = [
    { label: "Regions covered", value: String(data.national.regionCount) },
    { label: "Top region · revenue", value: topRevenue?.municipality ?? "—" },
    { label: "Most companies", value: topCompanies?.municipality ?? "—" },
    { label: "Highest avg pay", value: topPay?.municipality ?? "—" },
  ];
  return (
    <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-border/80 bg-card/80 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div key={c.label} className={`min-h-24 border-border/80 p-4 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} lg:border-r lg:last:border-r-0`}>
          <div className="font-mono text-[0.68rem] uppercase text-muted-foreground">{c.label}</div>
          <div className="mt-3 truncate text-2xl font-semibold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `RegionRankBars.tsx`** (horizontal bars, top 12 by active metric)

```tsx
"use client";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import numeral from "numeral";
import { regionMetricValue, type RegionMetric, type RegionRow } from "@/lib/api";

const fmt = (v: number, m: RegionMetric) =>
  m === "companies" ? numeral(v).format("0,0")
  : m === "employees" ? numeral(v).format("0,0")
  : m === "avgPay" ? numeral(v).format("0,0") + "€"
  : numeral(v).format("0.0a") + "€";

export function RegionRankBars({ rows, metric }: { rows: RegionRow[]; metric: RegionMetric }) {
  const data = [...rows]
    .map((r) => ({ name: r.municipality, value: regionMetricValue(r, metric) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            formatter={(v: number) => [fmt(v, metric), ""]}
            contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }}
          />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} label={{ position: "right", formatter: (v: number) => fmt(v, metric), fontSize: 10, fill: "hsl(var(--muted-foreground))" }}>
            {data.map((_, i) => <Cell key={i} fill={`hsl(var(--primary) / ${1 - i * 0.05})`} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 3: `RegionTreemap.tsx`** (market share by municipality; self-contained, theme-aware)

```tsx
"use client";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import numeral from "numeral";
import { regionMetricValue, type RegionMetric, type RegionRow } from "@/lib/api";

const Content = (props: any) => {
  const { x, y, width, height, name, depth } = props;
  if (depth !== 1) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: "hsl(var(--primary))", fillOpacity: Math.max(0.25, Math.min(0.9, width * height / 90000)), stroke: "hsl(var(--card))", strokeWidth: 1 }} />
      {width > 46 && height > 24 && (
        <text x={x + 6} y={y + 16} fontSize={11} fontFamily="var(--font-mono)" fill="hsl(var(--primary-foreground))">{name}</text>
      )}
    </g>
  );
};

export function RegionTreemap({ rows, metric }: { rows: RegionRow[]; metric: RegionMetric }) {
  const data = rows
    .map((r) => ({ name: r.municipality, size: Math.max(1, regionMetricValue(r, metric)) }))
    .sort((a, b) => b.size - a.size);
  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <Treemap data={data} dataKey="size" content={<Content />} aspectRatio={4 / 3}>
          <Tooltip
            formatter={(v: number) => [numeral(v).format("0,0"), metric]}
            contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: `RegionAvgPayChart.tsx`** (bars + national avg ReferenceLine)

```tsx
"use client";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import numeral from "numeral";
import type { RegionRow } from "@/lib/api";

export function RegionAvgPayChart({ rows, nationalAvg }: { rows: RegionRow[]; nationalAvg: number }) {
  const data = [...rows]
    .filter((r) => r.totalEmployees >= 5)
    .map((r) => ({ name: r.municipality, avgPay: r.avgPay }))
    .sort((a, b) => b.avgPay - a.avgPay)
    .slice(0, 14);
  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 56 }}>
          <CartesianGrid strokeDasharray="1 5" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" angle={-40} textAnchor="end" height={64} interval={0} tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => numeral(v).format("0,0")} />
          <Tooltip formatter={(v: number) => [numeral(v).format("0,0") + "€", "Avg pay"]} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} />
          <ReferenceLine y={nationalAvg} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" label={{ value: `Nat'l ${numeral(nationalAvg).format("0,0")}€`, position: "insideTopRight", fontSize: 10, fill: "hsl(var(--chart-2))" }} />
          <Bar dataKey="avgPay" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.avgPay >= nationalAvg ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: `RegionBubbleChart.tsx`** (x companies, y avg pay, z revenue)

```tsx
"use client";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import numeral from "numeral";
import type { RegionRow } from "@/lib/api";

export function RegionBubbleChart({ rows }: { rows: RegionRow[] }) {
  const data = rows
    .filter((r) => r.companyCount > 0 && r.avgPay > 0)
    .map((r) => ({ x: r.companyCount, y: r.avgPay, z: Math.max(1, r.totalRevenue), name: r.municipality }));
  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ScatterChart margin={{ top: 12, right: 18, left: 4, bottom: 28 }}>
          <CartesianGrid strokeDasharray="1 5" stroke="hsl(var(--border))" />
          <XAxis type="number" dataKey="x" name="Companies" scale="log" domain={["auto", "auto"]} tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} label={{ value: "Companies", position: "insideBottom", offset: -12, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis type="number" dataKey="y" name="Avg pay" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => numeral(v).format("0,0")} />
          <ZAxis type="number" dataKey="z" range={[40, 900]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }: any) =>
              active && payload?.length ? (
                <div className="rounded-md border border-border bg-popover p-2 text-xs text-popover-foreground">
                  <div className="font-semibold">{payload[0].payload.name}</div>
                  <div>{payload[0].payload.x} companies</div>
                  <div>{numeral(payload[0].payload.y).format("0,0")}€ avg pay</div>
                  <div>{numeral(payload[0].payload.z).format("0,0")}€ revenue</div>
                </div>
              ) : null
            }
          />
          <Scatter data={data} fill="hsl(var(--primary) / 0.55)" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 6: `RegionSectorMix.tsx`** (stacked bars from RegionSectorsResponse)

```tsx
"use client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import numeral from "numeral";
import type { RegionSectorsResponse } from "@/lib/api";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))"];

export function RegionSectorMix({ data }: { data: RegionSectorsResponse }) {
  const sectors = data.sectors.slice(0, 6);
  const chart = data.rows.map((r) => ({ name: r.municipality, ...Object.fromEntries(sectors.map((s) => [s, r.bySector[s] ?? 0])) }));
  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }} stackOffset="expand">
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip formatter={(v: number, n: string) => [numeral(v).format("0,0") + "€", n]} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)" }} />
          {sectors.map((s, i) => <Bar key={s} dataKey={s} stackId="a" fill={COLORS[i % COLORS.length]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 7: `RegionTrendLines.tsx`** (multi-year lines from RegionTrendsResponse)

```tsx
"use client";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import numeral from "numeral";
import type { RegionTrendsResponse } from "@/lib/api";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--primary))"];

export function RegionTrendLines({ data }: { data: RegionTrendsResponse }) {
  const chart = data.series.map((s) => ({ year: Number(s.year), ...s.values }));
  const names = data.municipalities.slice(0, 6);
  return (
    <div className="h-[22rem] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={chart} margin={{ top: 12, right: 18, left: 0, bottom: 36 }}>
          <CartesianGrid strokeDasharray="1 5" stroke="hsl(var(--border))" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : (v / 1e3).toFixed(0) + "k")} />
          <Tooltip formatter={(v: number, n: string) => [numeral(v).format("0,0"), n]} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--popover-foreground))" }} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "var(--font-mono)", paddingTop: 12 }} />
          {names.map((n, i) => <Line key={n} type="monotone" dataKey={n} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 8: Typecheck + commit**

Run: `cd apps/web && bunx tsc --noEmit`
```bash
git add apps/web/src/components/regions
git commit -m "Add presentational region chart components"
```

---

## Task 8: Choropleth map component

**Files:**
- Create: `apps/web/src/components/regions/MontenegroChoropleth.tsx`

- [ ] **Step 1: Implement the map**

```tsx
"use client";
import React from "react";
import { geoMercator, geoPath } from "d3-geo";
import numeral from "numeral";
import { matchRegionName } from "@/lib/regions-geo";
import { regionMetricValue, type RegionMetric, type RegionRow } from "@/lib/api";

type GeoJson = { type: "FeatureCollection"; features: any[] };

const NAME_PROP_CANDIDATES = ["shapeName", "NAME_1", "name"];
const featureName = (f: any): string => {
  for (const k of NAME_PROP_CANDIDATES) if (f.properties?.[k]) return String(f.properties[k]);
  return "";
};

export function MontenegroChoropleth({ rows, metric, geo }: { rows: RegionRow[]; metric: RegionMetric; geo: GeoJson }) {
  const [hover, setHover] = React.useState<{ name: string; value: number; x: number; y: number } | null>(null);
  const W = 640, H = 420;

  const geoNames = geo.features.map(featureName);
  const valueByGeoName = new Map<string, number>();
  let matched = 0;
  for (const r of rows) {
    const gn = matchRegionName(r.municipality, geoNames);
    if (gn) { valueByGeoName.set(gn, regionMetricValue(r, metric)); matched++; }
  }
  const max = Math.max(1, ...Array.from(valueByGeoName.values()));

  const projection = geoMercator().fitSize([W, H], geo as any);
  const path = geoPath(projection);
  const opacity = (v: number) => 0.12 + 0.83 * Math.sqrt(v / max);
  const notOnMap = rows.length - matched;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of Montenegro shaded by selected metric">
        {geo.features.map((f, i) => {
          const name = featureName(f);
          const v = valueByGeoName.get(name) ?? 0;
          const d = path(f) ?? undefined;
          return (
            <path
              key={i}
              d={d}
              fill={v > 0 ? `hsl(var(--primary) / ${opacity(v)})` : "hsl(var(--muted))"}
              stroke="hsl(var(--card))"
              strokeWidth={0.8}
              onMouseEnter={(e) => setHover({ name, value: v, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY })}
              onMouseMove={(e) => setHover((h) => (h ? { ...h, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : h))}
              onMouseLeave={() => setHover(null)}
              style={{ transition: "fill 150ms" }}
            />
          );
        })}
      </svg>

      {hover && (
        <div className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow"
             style={{ left: hover.x + 12, top: hover.y + 12 }}>
          <div className="font-semibold">{hover.name}</div>
          <div>{metric === "revenue" || metric === "avgPay" ? numeral(hover.value).format("0,0") + "€" : numeral(hover.value).format("0,0")}</div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-[0.7rem] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>low</span>
          <span className="h-2 w-24 rounded-sm" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.12), hsl(var(--primary)))" }} />
          <span>high</span>
        </div>
        {notOnMap > 0 && <span>{notOnMap} region{notOnMap === 1 ? "" : "s"} not shown on map</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit**

Run: `cd apps/web && bunx tsc --noEmit`
```bash
git add apps/web/src/components/regions/MontenegroChoropleth.tsx
git commit -m "Add Montenegro choropleth map component"
```

---

## Task 9: RegionsView orchestrator + route

**Files:**
- Create: `apps/web/src/components/regions/RegionsView.tsx`
- Create: `apps/web/app/regions/page.tsx`

- [ ] **Step 1: `RegionsView.tsx`** (client; URL-driven year/metric; fetch on change)

```tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Header } from "../Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  buildRegionParams, fetchApi, REGION_METRICS,
  type RegionMetric, type RegionsResponse, type RegionSectorsResponse, type RegionTrendsResponse, type SummaryResponse,
} from "@/lib/api";
import { RegionKpiStrip } from "./RegionKpiStrip";
import { RegionRankBars } from "./RegionRankBars";
import { RegionTreemap } from "./RegionTreemap";
import { RegionAvgPayChart } from "./RegionAvgPayChart";
import { RegionBubbleChart } from "./RegionBubbleChart";
import { RegionSectorMix } from "./RegionSectorMix";
import { RegionTrendLines } from "./RegionTrendLines";
import { MontenegroChoropleth } from "./MontenegroChoropleth";

const METRIC_LABEL: Record<RegionMetric, string> = { revenue: "Revenue", companies: "Companies", employees: "Employees", avgPay: "Avg pay" };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="analytics-panel border-border/80 bg-card/90">
      <CardHeader className="border-b border-border/70 p-4">
        <CardTitle className="font-display text-lg font-bold uppercase leading-none">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

export function RegionsView({
  years, summary, geo, initial,
}: {
  years: string[];
  summary: SummaryResponse;
  geo: any;
  initial: { year: string; metric: RegionMetric; regions: RegionsResponse; sectors: RegionSectorsResponse; trends: RegionTrendsResponse };
}) {
  const router = useRouter();
  const [year, setYear] = React.useState(initial.year);
  const [metric, setMetric] = React.useState<RegionMetric>(initial.metric);
  const [regions, setRegions] = React.useState(initial.regions);
  const [sectors, setSectors] = React.useState(initial.sectors);
  const [trends, setTrends] = React.useState(initial.trends);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams({ year, metric });
    const next = `/regions?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== next) router.replace(next, { scroll: false });
  }, [year, metric, router]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    Promise.all([
      fetchApi<RegionsResponse>("/regions", buildRegionParams({ year })),
      fetchApi<RegionSectorsResponse>("/regions/sectors", buildRegionParams({ year, limit: 8 })),
      fetchApi<RegionTrendsResponse>("/regions/trends", buildRegionParams({ metric, limit: 6 })),
    ])
      .then(([r, s, t]) => { if (cancelled) return; setRegions(r); setSectors(s); setTrends(t); })
      .catch((e) => { if (!cancelled) { console.error(e); setError("Could not load region data."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, metric]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header year={summary.year} companyCount={summary.companyCount} totalRevenue={summary.totalRevenue} totalEmployees={summary.totalEmployees} concentrationStats={summary.concentrationStats} />
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-14 pt-2 sm:px-6 lg:px-8">
        <section className="control-shell sticky top-3 z-30 mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold uppercase leading-none">Regions</h1>
            <p className="mt-1 text-xs text-muted-foreground">Company activity across Montenegro by municipality{loading ? " · loading…" : ""}{error ? ` · ${error}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32 rounded-md border-border/80 bg-background/80"><SelectValue /></SelectTrigger>
              <SelectContent className="border-border bg-card">{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <div className="inline-flex rounded-md border border-border/80 bg-background/70 p-1">
              {REGION_METRICS.map((m) => (
                <button key={m.key} onClick={() => setMetric(m.key)}
                  className={`h-8 rounded-sm px-3 text-xs font-semibold transition-colors ${metric === m.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-3"><RegionKpiStrip data={regions} /></div>

        <div className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Panel title={`Map · ${METRIC_LABEL[metric]}`}><MontenegroChoropleth rows={regions.municipalities} metric={metric} geo={geo} /></Panel>
          <Panel title={`Top regions · ${METRIC_LABEL[metric]}`}><RegionRankBars rows={regions.municipalities} metric={metric} /></Panel>
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-2">
          <Panel title={`Market share · ${METRIC_LABEL[metric]}`}><RegionTreemap rows={regions.municipalities} metric={metric} /></Panel>
          <Panel title="Average pay by region"><RegionAvgPayChart rows={regions.municipalities} nationalAvg={regions.national.avgPay} /></Panel>
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-2">
          <Panel title="Scale vs pay (bubble = revenue)"><RegionBubbleChart rows={regions.municipalities} /></Panel>
          <Panel title="Sector mix in top regions"><RegionSectorMix data={sectors} /></Panel>
        </div>

        <Panel title={`Year-over-year · ${METRIC_LABEL[metric]}`}><RegionTrendLines data={trends} /></Panel>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: `apps/web/app/regions/page.tsx`** (server component)

```tsx
import { Suspense } from "react";
import { promises as fs } from "fs";
import path from "path";
import { RegionsView } from "@/components/regions/RegionsView";
import {
  buildCompanyParams, buildRegionParams, fetchApi,
  type RegionMetric, type RegionsResponse, type RegionSectorsResponse, type RegionTrendsResponse, type SummaryResponse,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const METRICS: RegionMetric[] = ["revenue", "companies", "employees", "avgPay"];

export default async function RegionsPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const requestedYear = typeof sp.year === "string" ? sp.year : undefined;
  const metric: RegionMetric = (typeof sp.metric === "string" && METRICS.includes(sp.metric as RegionMetric)) ? (sp.metric as RegionMetric) : "revenue";

  const geoRaw = await fs.readFile(path.join(process.cwd(), "public", "montenegro-municipalities.json"), "utf8");
  const geo = JSON.parse(geoRaw);

  const summaryBase = await fetchApi<SummaryResponse>("/summary", undefined, { next: { revalidate: 300 } });
  const year = requestedYear && summaryBase.availableYears.includes(requestedYear) ? requestedYear : summaryBase.year;
  const summary = year === summaryBase.year ? summaryBase : await fetchApi<SummaryResponse>("/summary", buildCompanyParams({ year, sort: "totalIncome", dir: "desc" }), { next: { revalidate: 300 } });

  const [regions, sectors, trends] = await Promise.all([
    fetchApi<RegionsResponse>("/regions", buildRegionParams({ year }), { next: { revalidate: 300 } }),
    fetchApi<RegionSectorsResponse>("/regions/sectors", buildRegionParams({ year, limit: 8 }), { next: { revalidate: 300 } }),
    fetchApi<RegionTrendsResponse>("/regions/trends", buildRegionParams({ metric, limit: 6 }), { next: { revalidate: 300 } }),
  ]);

  return (
    <Suspense fallback={<div className="p-4">Loading regions…</div>}>
      <RegionsView years={summary.availableYears} summary={summary} geo={geo} initial={{ year, metric, regions, sectors, trends }} />
    </Suspense>
  );
}
```

- [ ] **Step 3: Typecheck, lint, build**

Run: `cd apps/web && bunx tsc --noEmit && bun run lint`
Then from repo root: `bun run build`
Expected: web + api build succeed.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/regions/page.tsx apps/web/src/components/regions/RegionsView.tsx
git commit -m "Add /regions page orchestrator and route"
```

---

## Task 10: Manual verification (machine with working DB)

- [ ] **Step 1:** `bun dev` from root.
- [ ] **Step 2:** Open `http://localhost:5173/regions`. Confirm: nav switches Dashboard↔Regions; map shades and tooltips; the 6 charts render; Year + Metric controls update all metric-driven panels and the URL (`?year=&metric=`).
- [ ] **Step 3:** Cross-check map coverage against `/summary` municipalities; add `OVERRIDES` entries for any unmatched names; confirm "N regions not shown" reflects reality.
- [ ] **Step 4:** Toggle dark/light — map + charts re-theme via CSS vars.
- [ ] **Step 5:** Commit any `OVERRIDES` additions.

---

## Self-Review Notes

- **Spec coverage:** route + SiteNav (T6/T9), URL state (T9), 3 endpoints (T2/T3), client types (T4), map + d3-geo + name-match (T1/T5/T8), all 7 viz + KPI strip (T7/T8/T9), error/loading (T9), tests (T2/T5). ✓
- **Type consistency:** `RegionMetric`, `RegionRow`, `RegionsResponse`, `RegionSectorsResponse`, `RegionTrendsResponse`, `regionMetricValue`, `buildRegionParams` defined in T4 and consumed identically in T7–T9. ✓
- **Known risk:** map name-matching depends on real municipality strings (enumerate via `/summary`; `OVERRIDES` is the escape hatch). DB-dependent verification deferred to T10.

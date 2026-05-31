import { Suspense } from "react";
import { Dashboard } from "../src/components/Dashboard";
import {
  buildCompanyParams,
  type CompaniesResponse,
  type CompanySortKey,
  type SummaryResponse,
  type SortDirection,
  type TrendResponse,
} from "@/lib/api";
import type { CompanyFiltersState } from "@/lib/company-filters";
import { fetchCachedApi } from "@/lib/server-api";

type DashboardSearchParams = { [key: string]: string | string[] | undefined };

const SORT_KEYS: CompanySortKey[] = [
  "name",
  "totalIncome",
  "profit",
  "employeeCount",
  "averagePay",
  "incomePerEmployee",
];

const str = (params: DashboardSearchParams, key: string) =>
  typeof params[key] === "string" ? (params[key] as string) : undefined;

function parseSort(value: string | undefined): CompanySortKey {
  return SORT_KEYS.includes(value as CompanySortKey) ? (value as CompanySortKey) : "totalIncome";
}

function parseDirection(value: string | undefined): SortDirection {
  return value === "asc" ? "asc" : "desc";
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function filtersFromParams(params: DashboardSearchParams): CompanyFiltersState {
  return {
    q: str(params, "q") || undefined,
    minRevenue: str(params, "minRevenue") || undefined,
    maxRevenue: str(params, "maxRevenue") || undefined,
    minEmployees: str(params, "minEmployees") || undefined,
    maxEmployees: str(params, "maxEmployees") || undefined,
    sector: str(params, "sector") || undefined,
    category: str(params, "category") || undefined,
    municipality: str(params, "municipality") || undefined,
  };
}

function hasFilters(filters: CompanyFiltersState) {
  return Object.values(filters).some(Boolean);
}

async function loadInitialDashboard(searchParams: DashboardSearchParams) {
  const base = await fetchCachedApi<SummaryResponse>("/summary");
  const requestedYear = str(searchParams, "year");
  const initialYear =
    requestedYear && base.availableYears.includes(requestedYear)
      ? requestedYear
      : base.year;
  const filters = filtersFromParams(searchParams);
  const sort = parseSort(str(searchParams, "sort"));
  const dir = parseDirection(str(searchParams, "dir"));
  const page = parsePage(str(searchParams, "page"));
  const summary =
    initialYear === base.year && !hasFilters(filters)
      ? base
      : await fetchCachedApi<SummaryResponse>(
          "/summary",
          buildCompanyParams({ year: initialYear, filters }),
        );
  const trendParams = buildCompanyParams({
    year: initialYear,
    sort: "totalIncome",
    dir: "desc",
    filters,
  });
  trendParams.set("metric", "totalIncome");

  const [companies, trends] = await Promise.all([
    fetchCachedApi<CompaniesResponse>(
      "/companies",
      buildCompanyParams({
        year: initialYear,
        page,
        pageSize: 50,
        sort,
        dir,
        filters,
      }),
    ),
    fetchCachedApi<TrendResponse>("/trends", trendParams),
  ]);

  return { summary, companies, trends };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  let initialData: Awaited<ReturnType<typeof loadInitialDashboard>>;

  try {
    initialData = await loadInitialDashboard(sp);
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        Failed to load company data.
      </main>
    );
  }

  const { summary } = initialData;
  const initialParams = {
    year: summary.year,
    q: str(sp, "q"),
    minRevenue: str(sp, "minRevenue"),
    maxRevenue: str(sp, "maxRevenue"),
    minEmployees: str(sp, "minEmployees"),
    maxEmployees: str(sp, "maxEmployees"),
    sector: str(sp, "sector"),
    category: str(sp, "category"),
    municipality: str(sp, "municipality"),
    sort: str(sp, "sort"),
    dir: str(sp, "dir"),
    page: str(sp, "page"),
  };

  return (
    <Suspense fallback={<div className="p-4">Loading dashboard...</div>}>
      <Dashboard
        years={summary.availableYears}
        initialParams={initialParams}
        initialSummary={summary}
        initialCompanies={initialData.companies}
        initialTrends={initialData.trends}
      />
    </Suspense>
  );
}

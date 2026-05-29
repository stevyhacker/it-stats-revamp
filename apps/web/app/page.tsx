import { Suspense } from "react";
import { Dashboard } from "../src/components/Dashboard";
import {
  buildCompanyParams,
  fetchApi,
  type CompaniesResponse,
  type SummaryResponse,
  type TrendResponse,
} from "@/lib/api";

export const dynamic = "force-dynamic";

async function loadInitialDashboard(requestedYear?: string) {
  const base = await fetchApi<SummaryResponse>(
    "/summary",
    undefined,
    { next: { revalidate: 300 } },
  );
  const initialYear =
    requestedYear && base.availableYears.includes(requestedYear)
      ? requestedYear
      : base.year;
  const summary =
    initialYear === base.year
      ? base
      : await fetchApi<SummaryResponse>(
          "/summary",
          buildCompanyParams({ year: initialYear, sort: "totalIncome", dir: "desc" }),
          { next: { revalidate: 300 } },
        );

  const [companies, trends] = await Promise.all([
    fetchApi<CompaniesResponse>(
      "/companies",
      buildCompanyParams({
        year: initialYear,
        page: 1,
        pageSize: 50,
        sort: "totalIncome",
        dir: "desc",
      }),
      { next: { revalidate: 300 } },
    ),
    fetchApi<TrendResponse>(
      "/trends",
      buildCompanyParams({
        year: initialYear,
        sort: "totalIncome",
        dir: "desc",
      }),
      { next: { revalidate: 300 } },
    ),
  ]);

  return { summary, companies, trends };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const requestedYear = typeof sp.year === "string" ? sp.year : undefined;

  let initialData: Awaited<ReturnType<typeof loadInitialDashboard>>;

  try {
    initialData = await loadInitialDashboard(requestedYear);
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        Failed to load company data.
      </main>
    );
  }

  const { summary } = initialData;
  const str = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);
  const initialParams = {
    year: summary.year,
    q: str("q"),
    minRevenue: str("minRevenue"),
    maxRevenue: str("maxRevenue"),
    minEmployees: str("minEmployees"),
    maxEmployees: str("maxEmployees"),
    sector: str("sector"),
    category: str("category"),
    municipality: str("municipality"),
    sort: str("sort"),
    dir: str("dir"),
    page: str("page"),
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

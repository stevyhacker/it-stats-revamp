import { Suspense } from "react";
import { Header } from "../src/components/Header";
import { Dashboard } from "../src/components/Dashboard";
import {
  buildCompanyParams,
  fetchApi,
  type CompaniesResponse,
  type SummaryResponse,
  type TrendResponse,
} from "@/lib/api";

export const dynamic = "force-dynamic";

async function loadInitialDashboard() {
  const summary = await fetchApi<SummaryResponse>(
    "/summary",
    undefined,
    { next: { revalidate: 300 } },
  );
  const initialYear = summary.year;
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

export default async function HomePage() {
  let initialData: Awaited<ReturnType<typeof loadInitialDashboard>>;

  try {
    initialData = await loadInitialDashboard();
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        Failed to load company data.
      </main>
    );
  }

  const { summary } = initialData;

  return (
    <>
      <Header
        latestYear={summary.year}
        companyCount={summary.companyCount}
        totalRevenue={summary.totalRevenue}
        totalEmployees={summary.totalEmployees}
        concentrationStats={summary.concentrationStats}
      />
      <main>
        <Suspense fallback={<div className="p-4">Loading dashboard...</div>}>
          <Dashboard
            years={summary.availableYears}
            initialSummary={summary}
            initialCompanies={initialData.companies}
            initialTrends={initialData.trends}
          />
        </Suspense>
      </main>
    </>
  );
}

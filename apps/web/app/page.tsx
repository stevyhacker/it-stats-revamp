import { Suspense } from "react";
import { Header } from "../src/components/Header";
import { Dashboard } from "../src/components/Dashboard";
import { companyData } from "@/lib/company-data";

export default function HomePage() {
  const data = companyData;

  const years = data.map((d) => d.year);

  if (data.length === 0) {
    return <main className="p-4">Failed to load company data.</main>;
  }

  const latestYearData = data[0];
  const totalRevenue = latestYearData.companyList.reduce(
    (sum, company) => sum + (company.totalIncome ?? 0),
    0
  );
  const totalEmployees = latestYearData.companyList.reduce(
    (sum, company) => sum + (company.employeeCount ?? 0),
    0
  );
  const companiesByRevenue = [...latestYearData.companyList].sort(
    (a, b) => (b.totalIncome ?? 0) - (a.totalIncome ?? 0)
  );
  const concentrationStats = [5, 10, 20].map((count) => ({
    label: `Top ${count} companies`,
    value: totalRevenue
      ? companiesByRevenue
          .slice(0, count)
          .reduce((sum, company) => sum + (company.totalIncome ?? 0), 0) /
        totalRevenue
      : 0,
  }));

  return (
    <>
      <Header
        latestYear={latestYearData.year}
        companyCount={latestYearData.companyList.length}
        totalRevenue={totalRevenue}
        totalEmployees={totalEmployees}
        concentrationStats={concentrationStats}
      />
      <main>
        <Suspense fallback={<div className="p-4">Loading dashboard...</div>}>
          <Dashboard years={years} data={data} />
        </Suspense>
      </main>
    </>
  );
}

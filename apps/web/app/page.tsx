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

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div className="p-4">Loading dashboard...</div>}>
          <Dashboard years={years} data={data} />
        </Suspense>
      </main>
    </>
  );
}

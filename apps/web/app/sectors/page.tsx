import { Suspense } from "react";
import { SectorsView } from "@/components/sectors/SectorsView";
import {
  buildCompanyParams,
  buildSectorParams,
  fetchApi,
  type SectorActivitiesResponse,
  type SectorMetric,
  type SectorsResponse,
  type SectorTrendsResponse,
  type SummaryResponse,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const METRICS: SectorMetric[] = ["revenue", "employees", "avgPay", "margin"];

export default async function SectorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const requestedYear = typeof sp.year === "string" ? sp.year : undefined;
  const metric: SectorMetric =
    typeof sp.metric === "string" && METRICS.includes(sp.metric as SectorMetric)
      ? (sp.metric as SectorMetric)
      : "revenue";
  const sector = typeof sp.sector === "string" && sp.sector.trim() ? sp.sector.trim() : null;

  let initialData: {
    summary: SummaryResponse;
    year: string;
    sectors: SectorsResponse;
    trends: SectorTrendsResponse;
    activities: SectorActivitiesResponse | null;
  };

  try {
    const summaryBase = await fetchApi<SummaryResponse>("/summary", undefined, {
      next: { revalidate: 300 },
    });
    const year =
      requestedYear && summaryBase.availableYears.includes(requestedYear)
        ? requestedYear
        : summaryBase.year;
    const summary =
      year === summaryBase.year
        ? summaryBase
        : await fetchApi<SummaryResponse>(
            "/summary",
            buildCompanyParams({ year, sort: "totalIncome", dir: "desc" }),
            { next: { revalidate: 300 } },
          );

    const [sectors, trends, activities] = await Promise.all([
      fetchApi<SectorsResponse>("/sectors", buildSectorParams({ year }), {
        next: { revalidate: 300 },
      }),
      fetchApi<SectorTrendsResponse>("/sectors/trends", buildSectorParams({ metric, limit: 6 }), {
        next: { revalidate: 300 },
      }),
      sector
        ? fetchApi<SectorActivitiesResponse>("/sectors/activities", buildSectorParams({ year, sector }), {
            next: { revalidate: 300 },
          })
        : Promise.resolve(null),
    ]);

    initialData = { summary, year, sectors, trends, activities };
  } catch (error) {
    console.error("Failed to load sectors data:", error);
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        Failed to load sectors data.
      </main>
    );
  }

  return (
    <Suspense fallback={<div className="p-4">Loading sectors…</div>}>
      <SectorsView
        years={initialData.summary.availableYears}
        summary={initialData.summary}
        initial={{
          year: initialData.year,
          metric,
          sector,
          sectors: initialData.sectors,
          trends: initialData.trends,
          activities: initialData.activities,
        }}
      />
    </Suspense>
  );
}

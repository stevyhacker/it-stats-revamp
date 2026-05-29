import { Suspense } from "react";
import { promises as fs } from "fs";
import path from "path";
import { RegionsView } from "@/components/regions/RegionsView";
import {
  buildCompanyParams,
  buildRegionParams,
  fetchApi,
  type RegionMetric,
  type RegionsResponse,
  type RegionSectorsResponse,
  type RegionTrendsResponse,
  type SummaryResponse,
} from "@/lib/api";

export const dynamic = "force-dynamic";

const METRICS: RegionMetric[] = ["revenue", "companies", "employees", "avgPay"];

export default async function RegionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const requestedYear = typeof sp.year === "string" ? sp.year : undefined;
  const metric: RegionMetric =
    typeof sp.metric === "string" && METRICS.includes(sp.metric as RegionMetric)
      ? (sp.metric as RegionMetric)
      : "revenue";

  const geoRaw = await fs.readFile(
    path.join(process.cwd(), "public", "montenegro-municipalities.json"),
    "utf8",
  );
  const geo = JSON.parse(geoRaw);

  let initialData: {
    summary: SummaryResponse;
    year: string;
    regions: RegionsResponse;
    sectors: RegionSectorsResponse;
    trends: RegionTrendsResponse;
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

    const [regions, sectors, trends] = await Promise.all([
      fetchApi<RegionsResponse>("/regions", buildRegionParams({ year }), {
        next: { revalidate: 300 },
      }),
      fetchApi<RegionSectorsResponse>("/regions/sectors", buildRegionParams({ year, limit: 8 }), {
        next: { revalidate: 300 },
      }),
      fetchApi<RegionTrendsResponse>("/regions/trends", buildRegionParams({ metric, limit: 6 }), {
        next: { revalidate: 300 },
      }),
    ]);

    initialData = { summary, year, regions, sectors, trends };
  } catch (error) {
    console.error("Failed to load regions data:", error);
    return (
      <main className="min-h-screen bg-background p-4 text-foreground">
        Failed to load regions data.
      </main>
    );
  }

  return (
    <Suspense fallback={<div className="p-4">Loading regions…</div>}>
      <RegionsView
        years={initialData.summary.availableYears}
        summary={initialData.summary}
        geo={geo}
        initial={{
          year: initialData.year,
          metric,
          regions: initialData.regions,
          sectors: initialData.sectors,
          trends: initialData.trends,
        }}
      />
    </Suspense>
  );
}

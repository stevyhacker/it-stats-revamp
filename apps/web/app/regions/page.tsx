import { Suspense } from "react";
import { promises as fs } from "fs";
import path from "path";
import { geoMercator, geoPath } from "d3-geo";
import { RegionsView } from "@/components/regions/RegionsView";
import type { MontenegroMapFeature } from "@/components/regions/MontenegroChoropleth";
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
const MAP_WIDTH = 640;
const MAP_HEIGHT = 420;
const NAME_PROP_CANDIDATES = ["shapeName", "NAME_1", "name"];

type GeoJson = { type: "FeatureCollection"; features: any[] };

const featureName = (feature: any): string => {
  for (const key of NAME_PROP_CANDIDATES) {
    if (feature.properties?.[key]) return String(feature.properties[key]);
  }
  return "";
};

function buildMapFeatures(geo: GeoJson): MontenegroMapFeature[] {
  const projection = geoMercator().fitSize([MAP_WIDTH, MAP_HEIGHT], geo as never);
  const pathForFeature = geoPath(projection);
  return geo.features
    .map((feature) => ({
      name: featureName(feature),
      path: pathForFeature(feature) ?? "",
    }))
    .filter((feature) => feature.name && feature.path);
}

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
  const mapFeatures = buildMapFeatures(JSON.parse(geoRaw));

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
        mapFeatures={mapFeatures}
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

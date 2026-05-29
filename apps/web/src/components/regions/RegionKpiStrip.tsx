"use client";

import type { RegionsResponse, RegionRow } from "@/lib/api";

const top = (rows: RegionRow[], by: (r: RegionRow) => number) =>
  rows.reduce<RegionRow | null>((best, r) => (!best || by(r) > by(best) ? r : best), null);

export function RegionKpiStrip({ data }: { data: RegionsResponse }) {
  const rows = data.municipalities;
  const topRevenue = top(rows, (r) => r.totalRevenue);
  const topCompanies = top(rows, (r) => r.companyCount);
  const topPay =
    top(rows.filter((r) => r.totalEmployees >= 10), (r) => r.avgPay) ?? top(rows, (r) => r.avgPay);

  const cards = [
    { label: "Regions covered", value: String(data.national.regionCount) },
    { label: "Top region · revenue", value: topRevenue?.municipality ?? "—" },
    { label: "Most companies", value: topCompanies?.municipality ?? "—" },
    { label: "Highest avg pay", value: topPay?.municipality ?? "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-border/80 bg-card/80 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`min-h-24 border-border/80 p-4 ${i % 2 === 0 ? "border-r" : ""} ${
            i < 2 ? "border-b lg:border-b-0" : ""
          } lg:border-r lg:last:border-r-0`}
        >
          <div className="font-mono text-[0.68rem] uppercase text-muted-foreground">{c.label}</div>
          <div className="mt-3 truncate text-2xl font-semibold">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

"use client";

import numeral from "numeral";
import type { SectorsResponse, SectorRow } from "@/lib/api";

const top = (rows: SectorRow[], by: (r: SectorRow) => number) =>
  rows.reduce<SectorRow | null>((best, r) => (!best || by(r) > by(best) ? r : best), null);

export function SectorKpiStrip({ data }: { data: SectorsResponse }) {
  const rows = data.sectors;
  const topRevenue = top(rows, (r) => r.totalRevenue);
  const topEmployees = top(rows, (r) => r.totalEmployees);
  // Restrict "highest margin" to sectors with enough companies so a single
  // outlier sector doesn't win on a fluke.
  const topMargin =
    top(rows.filter((r) => r.companyCount >= 3), (r) => r.profitMargin) ??
    top(rows, (r) => r.profitMargin);

  const cards = [
    { label: "Sectors covered", value: String(data.national.sectorCount) },
    { label: "Top sector · revenue", value: topRevenue?.sector ?? "—" },
    { label: "Most employees", value: topEmployees?.sector ?? "—" },
    {
      label: "Highest margin",
      value: topMargin ? `${topMargin.sector} · ${numeral(topMargin.profitMargin).format("0.0%")}` : "—",
    },
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

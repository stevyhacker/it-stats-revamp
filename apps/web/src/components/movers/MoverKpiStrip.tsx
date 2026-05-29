"use client";

import numeral from "numeral";
import type { CagrResponse, MoversResponse } from "@/lib/api";
import { fmtPct } from "./format";

export function MoverKpiStrip({ movers, cagr }: { movers: MoversResponse; cagr: CagrResponse }) {
  const gainer = movers.gainers[0] ?? null;
  const faller = movers.losers[0] ?? null;
  const grower = cagr.rows[0] ?? null;

  const cards = [
    {
      label: `Top gainer · ${movers.prevYear ?? "—"}→${movers.year}`,
      value: gainer ? gainer.name : "—",
      sub: gainer ? fmtPct(gainer.pctChange) : "",
    },
    {
      label: "Top faller",
      value: faller ? faller.name : "—",
      sub: faller ? fmtPct(faller.pctChange) : "",
    },
    {
      label: "Fastest grower · CAGR",
      value: grower ? grower.name : "—",
      sub: grower ? `${numeral(grower.cagr).format("+0.0%")}/yr` : "",
    },
    { label: "Tracked both years", value: numeral(movers.tracked).format("0,0"), sub: "" },
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
          <div className="mt-3 truncate text-xl font-semibold">{c.value}</div>
          {c.sub ? <div className="mt-1 font-mono text-xs text-muted-foreground">{c.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}

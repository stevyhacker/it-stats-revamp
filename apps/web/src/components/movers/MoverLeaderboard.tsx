"use client";

import Link from "next/link";
import type { MoverMetric, MoverRow } from "@/lib/api";
import { fmtDelta, fmtMoverValue, fmtPct } from "./format";

export function MoverLeaderboard({
  rows,
  metric,
  variant,
}: {
  rows: MoverRow[];
  metric: MoverMetric;
  variant: "gain" | "loss";
}) {
  if (rows.length === 0) {
    return (
      <div className="grid h-40 place-items-center text-sm text-muted-foreground">
        No qualifying {variant === "gain" ? "gainers" : "losers"} for this metric.
      </div>
    );
  }

  const deltaColor = variant === "gain" ? "text-emerald-500" : "text-red-500";

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left font-mono text-[0.68rem] uppercase text-muted-foreground">
            <th className="w-6 py-2 pr-1 font-normal">#</th>
            <th className="py-2 pr-2 font-normal">Company</th>
            <th className="py-2 pr-2 text-right font-normal">{`Prev → now`}</th>
            <th className="py-2 pr-2 text-right font-normal">Δ</th>
            <th className="py-2 text-right font-normal">Δ%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.pib} className="border-b border-border/40 last:border-0 hover:bg-muted/40">
              <td className="py-2 pr-1 font-mono text-xs text-muted-foreground">{i + 1}</td>
              <td className="py-2 pr-2">
                <Link href={`/company/${r.pib}/`} className="font-medium hover:text-primary hover:underline">
                  {r.name}
                </Link>
              </td>
              <td className="py-2 pr-2 text-right font-mono text-xs text-muted-foreground">
                {fmtMoverValue(r.previous, metric)} → {fmtMoverValue(r.current, metric)}
              </td>
              <td className={`py-2 pr-2 text-right font-mono text-xs font-semibold ${deltaColor}`}>
                {fmtDelta(r.delta, metric)}
              </td>
              <td className={`py-2 text-right font-mono text-xs font-semibold ${deltaColor}`}>
                {fmtPct(r.pctChange)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

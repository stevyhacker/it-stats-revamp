"use client";

import Link from "next/link";
import numeral from "numeral";
import type { CagrRow } from "@/lib/api";

const fmtEur = (v: number) => numeral(v).format("0.0a") + "€";

export function CagrLeaderboard({ rows }: { rows: CagrRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="grid h-40 place-items-center text-sm text-muted-foreground">
        No companies clear the CAGR thresholds.
      </div>
    );
  }

  // Bar widths are scaled to the top CAGR so the leader fills the track.
  const maxCagr = Math.max(...rows.map((r) => r.cagr), 0.0001);

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.pib} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/company/${r.pib}/`}
                className="truncate text-sm font-medium hover:text-primary hover:underline"
              >
                {r.name}
              </Link>
              <span className="shrink-0 font-mono text-sm font-semibold text-emerald-500">
                {numeral(r.cagr).format("+0.0%")}/yr
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-sm bg-muted">
              <div
                className="h-full rounded-sm bg-primary"
                style={{ width: `${Math.max(3, (r.cagr / maxCagr) * 100)}%` }}
              />
            </div>
            <div className="mt-1 font-mono text-[0.68rem] text-muted-foreground">
              {fmtEur(r.first)} ({r.firstYear}) → {fmtEur(r.latest)} ({r.latestYear}) · {r.span}y
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

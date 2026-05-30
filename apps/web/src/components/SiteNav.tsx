"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleStackIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/sectors", label: "Sectors" },
  { href: "/regions", label: "Regions" },
  { href: "/movers", label: "Movers" },
];

export function SiteNav({ showMeta = true }: { showMeta?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="control-shell flex min-h-14 items-center justify-between overflow-hidden">
      <div className="flex min-w-0 items-center">
        <Link href="/" className="flex min-w-0 items-center gap-3 px-3 py-2 sm:px-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/80 bg-card text-primary shadow-sm">
            <span className="font-display text-xl font-bold leading-none">M</span>
          </span>
          <span className="hidden truncate font-display text-2xl font-bold leading-none text-foreground sm:block">
            MNEStats.me
          </span>
        </Link>
        <div className="ml-1 flex min-w-0 items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="hidden h-14 items-center justify-end divide-x divide-border/80 lg:flex">
        {showMeta && (
          <div className="flex items-center gap-2 px-5 text-xs text-muted-foreground">
            <CircleStackIcon className="h-4 w-4 text-primary" />
            <span>Data source: Central Register of Business Entities (CRPS)</span>
            <InformationCircleIcon className="h-4 w-4" />
          </div>
        )}
        <div className="px-3">
          <ThemeToggle className="h-10 w-10 rounded-md border-border/80 bg-background/45" />
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 lg:hidden">
        <ThemeToggle className="h-10 w-10 rounded-md border-border/80 bg-background/45" />
      </div>
    </nav>
  );
}

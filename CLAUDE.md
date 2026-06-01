# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ITStats.me is a comprehensive dashboard for analyzing Montenegrin tech companies' financial performance. This is a full-stack TypeScript monorepo using Turborepo for build orchestration, with a Next.js frontend and Hono API backend, backed by a Drizzle ORM + PostgreSQL database.

## Architecture

### Monorepo Structure
- **apps/web/**: Next.js 16 frontend (App Router, Turbopack) with TypeScript, Tailwind CSS v4, and Recharts for data visualization
- **apps/api/**: Hono API server running on Bun
- **packages/db/**: Shared database layer using Drizzle ORM with PostgreSQL

### Key Technologies
- **Runtime**: Bun (API server) + Node.js (Next.js)
- **Frontend**: React 19, Next.js 16, Tailwind CSS v4, Radix UI components
- **Backend**: Hono web framework (no authentication is currently wired in; see note on `/api/protected` below)
- **Database**: PostgreSQL with Drizzle ORM
- **Visualization**: Recharts for charts and data presentation
- **Build System**: Turborepo with Bun workspaces

## Development Commands

### Root Level Commands (run from project root)
- `bun dev` - Start both frontend and backend development servers
- `bun run build` - Build all apps for production
- `bun run lint` - Lint the entire codebase
- `bun run format` - Format code with Prettier

### Database Commands
- `bun db:generate` - Generate Drizzle migrations
- `bun db:migrate` - Generate and push database migrations
- `bun db:push` - Push schema changes to database
- `bun db:studio` - Open Drizzle Studio for database inspection
- `bun --filter db run seed` - Seed database with initial data

### Individual App Commands
- `bun --filter web run dev` - Start only the frontend (Next.js)
- `bun --filter api run dev` - Start only the backend (Hono/Bun)
- `bun --filter web run build` - Build frontend only
- `bun --filter api run build` - Build API only

## Database Schema

### Core Tables
- **years**: Stores year values (2020, 2021, etc.)
- **companies**: Main company data with financial metrics
  - Links to years via `yearId` foreign key
  - Unique constraints: company name + year, PIB + year
  - Financial fields: totalIncome, profit, employeeCount, netPayCosts, averagePay, incomePerEmployee
  - Classification/geo fields: municipality, sector (defaults to `'Other'`), activityCode, activityName, legalStatus
  - Identity/ingest fields: name, pib, reportId, parseStatus
- **users**: Legacy table (with `clerkId`) retained in the schema from a previous Clerk integration; not used by the current API

### Key Relationships
- Companies have a many-to-one relationship with years
- Each company can have multiple entries across different years
- PIB (tax ID) uniqueness is enforced per year, not globally

## API Endpoints

- `GET /summary` - Year aggregates (totals, YoY, concentration, filter options, top companies)
- `GET /companies` - Paginated, filterable, sortable companies for a year
- `GET /companies/:pib` - Returns specific company data across all years
- `GET /trends` - Multi-year metric series for the top (or selected) companies
- `GET /regions` - Per-municipality aggregates for a year (revenue, profit, employees, employee-weighted avg pay, revenue/employee) plus national totals
- `GET /regions/sectors` - Sector revenue split within the top-N municipalities (stacked-bar data)
- `GET /regions/trends` - Multi-year metric series for the top-N municipalities
- `GET /sectors` - Per-sector aggregates for a year plus national totals
- `GET /sectors/activities` - Activity (NACE) breakdown within a given sector
- `GET /sectors/trends` - Multi-year metric series for the top-N sectors
- `GET /movers` - Year-over-year movers leaderboard (biggest gainers/decliners by metric)
- `GET /movers/cagr` - Multi-year CAGR leaderboard by metric
- `GET /export.csv` - CSV export of the filtered company set
- `GET /years` - Returns available years in descending order
- `GET /api/protected` - Example route mounted under the `/api` base path; returns a static message and is **not** authenticated (left over from a removed Clerk integration)

Aggregation math is split into per-domain modules, each unit-tested: region math (employee-weighted average pay, revenue-per-employee) in `apps/api/src/regions.ts` (`regions.test.ts`), sector math in `apps/api/src/sectors.ts` (`sectors.test.ts`), and mover/CAGR math in `apps/api/src/movers.ts` (`movers.test.ts`).

## Frontend Components

### Pages (App Router, `apps/web/app/`)
- **/** (`page.tsx`): Main dashboard with year selector, filters, and company table
- **/sectors** (`sectors/page.tsx`): Sector analytics — KPI strip plus sector rank/treemap/margin/trend breakdowns and an activity (NACE) drill-down
- **/regions** (`regions/page.tsx`): Geographic analytics — Montenegro choropleth map plus six municipality breakdowns; URL-driven `year` + `metric` (`revenue` | `companies` | `employees` | `avgPay`)
- **/movers** (`movers/page.tsx`): Year-over-year and multi-year CAGR leaderboards of biggest gainers/decliners
- **/company/[companyName]**: Per-company detail across years

### Core Components
- **SiteNav.tsx**: Shared top navigation (logo + Dashboard/Sectors/Regions/Movers links + theme toggle), used by the dashboard `Header` and the Sectors/Regions/Movers pages
- **Dashboard.tsx**: Main dashboard with year selector and company table
- **CompanyTable.tsx**: Data table with sorting and filtering
- **Charts.tsx**: Various chart components for data visualization
- **MarketShareTreemap.tsx**: Treemap visualization for market share
- **TrendLineChart.tsx**: Line charts for trending data

### Regions Components (`apps/web/src/components/regions/`)
- **RegionsView.tsx**: Client orchestrator owning URL-driven year/metric state and data fetching
- **MontenegroChoropleth.tsx**: `d3-geo` + SVG choropleth (no map framework); boundary GeoJSON at `apps/web/public/montenegro-municipalities.json`
- **RegionKpiStrip / RegionRankBars / RegionTreemap / RegionAvgPayChart / RegionBubbleChart / RegionSectorMix / RegionTrendLines**: the KPI strip and six Recharts visualizations
- Municipality name-matching (data values → GeoJSON `shapeName`) lives in `apps/web/src/lib/regions-geo.ts` (tested in `regions-geo.test.ts`); add to its `OVERRIDES` map for spelling mismatches

### Sectors Components (`apps/web/src/components/sectors/`)
- **SectorsView.tsx**: Client orchestrator owning URL-driven year/metric state and data fetching
- **SectorKpiStrip / SectorRankBars / SectorTreemap / SectorMarginChart / SectorTrendLines / SectorActivityPanel**: the KPI strip and Recharts visualizations (the activity panel drives the `/sectors/activities` drill-down)

### Movers Components (`apps/web/src/components/movers/`)
- **MoversView.tsx**: Client orchestrator for the year-over-year and CAGR leaderboards
- **MoverKpiStrip / MoverLeaderboard / CagrLeaderboard**: KPI strip, the year-over-year gainer/decliner table, and the multi-year CAGR table

### UI Components (Radix-based)
- Located in `apps/web/src/components/ui/`
- Includes button, card, select, table, tabs components
- Styled with Tailwind CSS and class-variance-authority

### Theme System
- **Centralized Theme Management**: Uses React Context (`ThemeProvider`) for global theme state
- **Theme Toggle Components**: `ThemeToggle` component available in floating and inline variants
- **Anti-FOUC Script**: `ThemeScript` prevents flash of unstyled content during page load
- **System Preference Detection**: Automatically detects user's OS theme preference
- **LocalStorage Persistence**: Theme choice persists across sessions
- **SSR Compatible**: Handles server-side rendering without hydration mismatches

## Environment Setup

### Required Environment Variables
- **packages/db/.env**: `DATABASE_URL` — used by Drizzle tooling/seed and by the db package when run from that directory
- **apps/api/.env**: `DATABASE_URL` — loaded by Bun from the API's working directory at runtime, so this is the connection the running API server actually uses

Both files point at a hosted PostgreSQL instance; keep them in sync if you want the API and the migration tooling to target the same database.

### Development Workflow
1. Clone repository and run `bun install`
2. Set up database environment variables
3. Run `bun db:seed` to populate initial data
4. Use `bun dev` to start both frontend and backend
5. Frontend runs on `http://localhost:5173`, API on `http://localhost:3000`

## Code Conventions

- TypeScript strict mode enabled across all packages
- Shared types defined in `apps/web/src/types.ts` and inferred from Drizzle schema
- Database queries use Drizzle's query builder with proper joins
- Components follow functional React patterns with hooks
- Tailwind CSS for styling with dark mode support
- ESLint configuration extends Next.js and TypeScript recommended rules

## Testing and Building

The project uses Turborepo's pipeline for coordinated builds. Always run `bun run build` from root to ensure proper dependency resolution between packages. The database package is a dependency for the API, creating a build-time dependency chain.

## Data Source

All financial data comes from Montenegro's Tax Administration public records. The application provides read-only analysis of publicly available company financial information.

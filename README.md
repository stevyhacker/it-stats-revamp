# ITStats.me

A dashboard for analyzing Montenegrin company financial performance, employment, sectors, municipalities, and year-over-year trends.

## Data Source

All data presented in this application is collected from a public source: [Tax Administration of Montenegro](https://eprijava.tax.gov.me/). The data is publicly available and is used for informational purposes only.

## Features

- API-backed company search, filters, sorting, and pagination
- Year-over-year financial and employment tracking
- Company-specific historical profile pages by PIB
- Market overview with revenue, employee, concentration, and filter metrics
- Regions page: Montenegro choropleth map plus per-municipality breakdowns (ranking, market share, average pay, scale-vs-pay, sector mix, and year-over-year trends)
- Server-side CSV export for filtered company views
- Growth and efficiency comparisons
- Dark mode support
- Responsive design

## Architecture

The app is a Bun/Turborepo monorepo with a Hono API, a Next.js frontend, and a shared Drizzle/Postgres package.

- `apps/api` exposes the database-backed JSON and CSV endpoints.
- `apps/web` renders the dashboard, regions, and profile pages, then fetches paginated data from the API.
- `packages/db` owns the Drizzle schema, migrations, and database connection.
- `scripts/import-irms-processed.ts` imports processed IRMS/CRPS-style company data into Postgres.

The frontend no longer imports the full company dataset or statically generates every company page. Large table views, search, profile history, trends, and CSV export are served by indexed API queries.

## Technologies Used

### Backend
- [Bun](https://bun.sh/) - JavaScript Runtime & Toolkit
- [Hono](https://hono.dev/) - Web Framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Supabase](https://supabase.com/) - PostgreSQL Database Hosting

### Frontend
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) for data visualization
- [Lucide React](https://lucide.dev/) for icons

### Tooling
- [Bun](https://bun.sh/) - JavaScript Runtime & Package Manager
- [Turborepo](https://turbo.build/repo) - Monorepo Build System

## Local Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)

### Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/stevyhacker/it-stats-revamp.git # Use your repo URL if different
    cd it-stats-revamp
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Set up environment variables:
    - Add your Postgres connection string for the process that needs it. Use `packages/db/.env` for Drizzle and seed commands, `apps/api/.env` for the API server, or export it in the shell for one-off import commands:
      ```env
      DATABASE_URL="postgresql://user:password@host:port/database"
      ```
    - Optional frontend API overrides can live in `apps/web/.env.local`:
      ```env
      API_URL="http://localhost:3000"
      NEXT_PUBLIC_API_URL="http://localhost:3000"
      ```
      `API_URL` is used by server-side Next.js requests. `NEXT_PUBLIC_API_URL` is used by browser requests and CSV export links.

4.  Apply database schema changes:
    ```bash
    bun run db:push
    ```

5.  Seed or import data:
    ```bash
    # Legacy bundled sample data
    bun --filter db run seed

    # Broad processed IRMS/CRPS-style data
    DATABASE_URL="postgresql://user:password@host:port/database" \
      bun run scripts/import-irms-processed.ts /path/to/companies_latest_partial.jsonl
    ```

6.  Start the development servers:
    - This command starts both frontend and backend concurrently:
      ```bash
      bun dev
      ```
    - (Alternatively, run them separately in different terminals):
      ```bash
      # Backend API
      bun --filter api run dev
      # Frontend App
      bun --filter web run dev
      ```

7.  Open your browser and visit `http://localhost:5173`. The API server runs on `http://localhost:3000` by default.

## API Endpoints

- `GET /summary?year=2024`: summary KPIs, available years, filter options, concentration stats, and top companies.
- `GET /companies?year=2024&page=1&pageSize=50&sort=totalIncome&dir=desc&q=...`: paginated company rows plus the total matching count.
- `GET /companies/:pib`: all historical rows for a single company PIB.
- `GET /trends?year=2024&metric=totalIncome&companyPibs=...`: year series for selected companies, or top companies when none are provided.
- `GET /regions?year=2024`: per-municipality aggregates (revenue, profit, employees, employee-weighted average pay, revenue/employee) plus national totals.
- `GET /regions/sectors?year=2024&limit=8`: sector revenue split within the top-N municipalities.
- `GET /regions/trends?metric=totalIncome&limit=6`: year series for the top-N municipalities.
- `GET /export.csv?...`: CSV export for every row matching the same filters and sort as `/companies`.
- `GET /years`: available reporting years.

Supported company filters are `q`, `sector`, `category`, `municipality`, `minRevenue`, `maxRevenue`, `minEmployees`, and `maxEmployees`. Supported sort keys are `name`, `totalIncome`, `profit`, `employeeCount`, `averagePay`, and `incomePerEmployee`.

## Available Scripts

Key scripts (run from the root directory):

- `bun install`: Installs all dependencies for the monorepo.
- `bun dev`: Starts development servers for both `api` and `web` apps concurrently.
- `bun run build`: Builds both `api` and `web` apps for production.
- `bun run lint`: Lints the codebase.
- `bun --filter db run seed`: Seeds the database with initial data (requires `.env` setup in `packages/db`).
- `bun run scripts/import-irms-processed.ts <path>`: Imports processed broad company data into Postgres.
- `bun --filter api run dev`: Starts only the backend API development server.
- `bun --filter web run dev`: Starts only the frontend development server.

# ITStats.me

A comprehensive dashboard for analyzing Montenegrin tech companies' financial performance and growth insights.

## Data Source

All data presented in this application is collected from a public source: [Tax Administration of Montenegro](https://eprijava.tax.gov.me/). The data is publicly available and is used for informational purposes only.

## Features

- Year-over-year financial performance tracking
- Company-specific detailed analysis
- Market overview with key metrics
- Growth and efficiency comparisons
- Dark mode support
- Responsive design

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
- [pnpm](https://pnpm.io/) - Package Manager
- [Turborepo](https://turbo.build/repo) - Monorepo Build System

## Local Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)
- [pnpm](https://pnpm.io/) (v8 or higher recommended)

### Getting Started

1.  Clone the repository:
    ```bash
    git clone https://github.com/stevyhacker/it-stats-revamp.git # Use your repo URL if different
    cd it-stats-revamp
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up environment variables:
    - Create a `.env` file in the `packages/db` directory.
    - Add your Supabase database connection string (obtain from your Supabase project settings):
      ```env
      DATABASE_URL="postgresql://user:password@host:port/database"
      ```

4.  Seed the database (run once):
    ```bash
    pnpm --filter db run seed
    ```

5.  Start the development servers:
    - This command starts both frontend and backend concurrently:
      ```bash
      pnpm dev
      ```
    - (Alternatively, run them separately in different terminals):
      ```bash
      # Backend API
      pnpm --filter api run dev
      # Frontend App
      pnpm --filter web run dev
      ```

6.  Open your browser and visit `http://localhost:5173` (or the port shown for the `web` app). The API server runs on `http://localhost:3000` by default.

## Available Scripts

Key scripts (run from the root directory):

- `pnpm install`: Installs all dependencies for the monorepo.
- `pnpm dev`: Starts development servers for both `api` and `web` apps concurrently.
- `pnpm build`: Builds both `api` and `web` apps for production.
- `pnpm lint`: Lints the codebase.
- `pnpm --filter db run seed`: Seeds the database with initial data (requires `.env` setup in `packages/db`).
- `pnpm --filter api run dev`: Starts only the backend API development server.
- `pnpm --filter web run dev`: Starts only the frontend development server.
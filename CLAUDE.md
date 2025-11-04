# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ITStats.me is a comprehensive dashboard for analyzing Montenegrin tech companies' financial performance. This is a full-stack TypeScript monorepo using Turborepo for build orchestration, with a Next.js frontend and Hono API backend, backed by a Drizzle ORM + PostgreSQL database.

## Architecture

### Monorepo Structure
- **apps/web/**: Next.js 15 frontend with TypeScript, Tailwind CSS, and Recharts for data visualization
- **apps/api/**: Hono API server running on Bun with Clerk authentication
- **packages/db/**: Shared database layer using Drizzle ORM with PostgreSQL

### Key Technologies
- **Runtime**: Bun (API server) + Node.js (Next.js)
- **Frontend**: React 19 RC, Next.js 15, Tailwind CSS, Radix UI components
- **Backend**: Hono web framework with Clerk authentication middleware
- **Database**: PostgreSQL with Drizzle ORM, hosted on Supabase
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
  - Fields: name, pib, totalIncome, profit, employeeCount, netPayCosts, averagePay, incomePerEmployee
- **users**: Clerk authentication integration

### Key Relationships
- Companies have a many-to-one relationship with years
- Each company can have multiple entries across different years
- PIB (tax ID) uniqueness is enforced per year, not globally

## API Endpoints

- `GET /companies` - Returns all companies grouped by year
- `GET /companies/:pib` - Returns specific company data across all years
- `GET /years` - Returns available years in descending order
- `GET /api/protected` - Example protected route requiring Clerk authentication

## Frontend Components

### Core Components
- **Dashboard.tsx**: Main dashboard with year selector and company table
- **CompanyTable.tsx**: Data table with sorting and filtering
- **Charts.tsx**: Various chart components for data visualization
- **MarketShareTreemap.tsx**: Treemap visualization for market share
- **TrendLineChart.tsx**: Line charts for trending data

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
- **packages/db/.env**: `DATABASE_URL` for PostgreSQL connection

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
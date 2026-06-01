# Repository Guidelines

## Project Structure & Module Organization

This is a Bun/Turborepo TypeScript monorepo. `apps/web` contains the Next.js frontend: routes in `apps/web/app`, components in `apps/web/src/components`, helpers in `apps/web/src/lib`, and static assets in `apps/web/public`. `apps/api` contains the Hono API server and math helpers. `packages/db` owns Drizzle schema, migrations, and connection code. Import/setup scripts live in `scripts`; planning docs live in `docs`; `backups` contains data dumps.

## Build, Test, and Development Commands

- `bun install`: install workspace dependencies.
- `bun dev`: start API and web apps through Turbo.
- `cd apps/web && bun run dev`: run only the frontend on `http://localhost:5173`.
- `cd apps/api && bun run dev`: run only the API, normally on `http://localhost:3000`.
- `bun run build`: build all workspaces.
- `bun run lint`: run configured workspace lint tasks.
- `bun run format`: format TS/TSX/Markdown with Prettier.
- `bun run db:generate`, `bun run db:push`, `bun run db:studio`: manage Drizzle schema.
- `bun test apps/api/src/*.test.ts apps/web/src/lib/*.test.ts`: run the current Bun unit tests.

## Coding Style & Naming Conventions

Use strict TypeScript and two-space indentation. React components use PascalCase filenames, hooks/helpers use camelCase, and tests are colocated as `*.test.ts`. Prefer small pure helpers for aggregation, filtering, URL params, and municipality normalization. Keep shared UI primitives in `apps/web/src/components/ui`.

## Testing Guidelines

The project uses `bun:test`; there is no root `test` script. Add or update tests when changing API math, filters, sort keys, URL params, normalization, or region/sector/mover logic. For UI changes, run relevant unit tests plus `bun run lint`; run `bun run build` when a change crosses package or app boundaries.

## Commit & Pull Request Guidelines

Recent commits use concise imperative subjects, for example `Add movers page with year-over-year and CAGR leaderboards`. Keep commits scoped to one behavior. PRs should include a summary, linked issue if available, test commands, screenshots for visual changes, and migration/import notes.

## Security & Configuration Tips

Store `DATABASE_URL` in the process-specific env file: `packages/db/.env` for Drizzle and seed commands, `apps/api/.env` for the API, and `apps/web/.env.local` for `API_URL` or `NEXT_PUBLIC_API_URL`. Do not commit secrets, generated dumps, or local build artifacts.

## Agent-Specific Instructions

Before installing any new npm package, verify the selected version was published at least seven days ago. Respect existing local modifications and keep edits limited to the requested scope.

ALTER TABLE "companies" DROP CONSTRAINT "companies_pib_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pib_year_unique_idx" ON "companies" ("pib","year_id");
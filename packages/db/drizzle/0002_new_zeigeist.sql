DROP INDEX IF EXISTS "company_year_unique_idx";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "total_income" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "profit" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "net_pay_costs" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "income_per_employee" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "report_id" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "legal_status" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "municipality" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "activity_code" varchar(20);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "activity_name" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "sector" varchar(96) DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "parse_status" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_year_income_idx" ON "companies" ("year_id","total_income" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_year_profit_idx" ON "companies" ("year_id","profit" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_year_employees_idx" ON "companies" ("year_id","employee_count" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_pib_year_idx" ON "companies" ("pib","year_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_filters_idx" ON "companies" ("year_id","sector","municipality","activity_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_name_trgm_idx" ON "companies" USING gin ("name" gin_trgm_ops);

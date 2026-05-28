import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

// Example User table - align this with your actual Clerk/app needs
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(), // To link with Clerk users
  email: varchar('email', { length: 256 }).unique().notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- IT Stats Data Tables ---

export const years = pgTable('years', {
  id: serial('id').primaryKey(),
  yearValue: integer('year_value').unique().notNull(), // e.g., 2024
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  pib: varchar('pib', { length: 50 }).notNull(), // PIB is required, but uniqueness handled below
  reportId: text('report_id'),
  legalStatus: text('legal_status'),
  municipality: text('municipality'),
  activityCode: varchar('activity_code', { length: 20 }),
  activityName: text('activity_name'),
  sector: varchar('sector', { length: 96 }).default('Other').notNull(),
  parseStatus: text('parse_status'),
  totalIncome: bigint('total_income', { mode: 'number' }),
  profit: bigint('profit', { mode: 'number' }),
  employeeCount: integer('employee_count'),
  netPayCosts: bigint('net_pay_costs', { mode: 'number' }),
  averagePay: integer('average_pay'), // Storing as integer
  incomePerEmployee: bigint('income_per_employee', { mode: 'number' }),
  yearId: integer('year_id').notNull().references(() => years.id, { onDelete: 'cascade' }), // Foreign key to years table
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    // Define composite unique constraint for pib and yearId
    pibYearUnique: uniqueIndex('pib_year_unique_idx').on(table.pib, table.yearId),
    companiesYearIncomeIdx: index('companies_year_income_idx').on(table.yearId, table.totalIncome),
    companiesYearProfitIdx: index('companies_year_profit_idx').on(table.yearId, table.profit),
    companiesYearEmployeesIdx: index('companies_year_employees_idx').on(table.yearId, table.employeeCount),
    companiesPibYearIdx: index('companies_pib_year_idx').on(table.pib, table.yearId),
    companiesFiltersIdx: index('companies_filters_idx').on(
      table.yearId,
      table.sector,
      table.municipality,
      table.activityCode,
    ),
    companiesNameIdx: index('companies_name_idx').on(table.name),
  };
});

// Add other tables for your application data here
// e.g., company stats, etc.

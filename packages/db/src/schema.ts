import { pgTable, serial, text, timestamp, varchar, integer, numeric, uniqueIndex } from 'drizzle-orm/pg-core';

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
  totalIncome: integer('total_income'), // Using integer, adjust if decimals needed
  profit: integer('profit'),
  employeeCount: integer('employee_count'),
  netPayCosts: integer('net_pay_costs'),
  averagePay: integer('average_pay'), // Storing as integer
  incomePerEmployee: integer('income_per_employee'),
  websiteUrl: varchar('website_url', { length: 255 }),
  companyDescription: text('company_description'),
  yearId: integer('year_id').notNull().references(() => years.id, { onDelete: 'cascade' }), // Foreign key to years table
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    // Add unique constraint for company name within a specific year
    companyYearUniqueIdx: uniqueIndex('company_year_unique_idx').on(table.name, table.yearId),
    // Define composite unique constraint for pib and yearId
    pibYearUnique: uniqueIndex('pib_year_unique_idx').on(table.pib, table.yearId),
  };
});

// Add other tables for your application data here
// e.g., company stats, etc.

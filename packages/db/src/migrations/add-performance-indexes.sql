-- Add indexes for performance optimization

-- Index on companies.yearId for faster joins with years table
CREATE INDEX IF NOT EXISTS idx_companies_year_id ON companies(year_id);

-- Index on companies.pib for faster lookups by PIB
CREATE INDEX IF NOT EXISTS idx_companies_pib ON companies(pib);

-- Index on companies.name for faster lookups and sorting by company name
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Composite index for sorting by totalIncome within a year
CREATE INDEX IF NOT EXISTS idx_companies_year_income ON companies(year_id, total_income DESC);

-- Composite index for sorting by profit within a year
CREATE INDEX IF NOT EXISTS idx_companies_year_profit ON companies(year_id, profit DESC);

-- Composite index for sorting by employeeCount within a year
CREATE INDEX IF NOT EXISTS idx_companies_year_employees ON companies(year_id, employee_count DESC);

-- Index on years.yearValue for faster sorting and lookups
CREATE INDEX IF NOT EXISTS idx_years_value ON years(year_value DESC);

-- Composite index for the unique constraint lookup
CREATE INDEX IF NOT EXISTS idx_companies_name_year ON companies(name, year_id);

-- Composite index for filtering by income ranges within a year
CREATE INDEX IF NOT EXISTS idx_companies_income_filter ON companies(year_id, total_income) WHERE total_income IS NOT NULL;

-- Composite index for filtering by employee count ranges within a year
CREATE INDEX IF NOT EXISTS idx_companies_employee_filter ON companies(year_id, employee_count) WHERE employee_count IS NOT NULL;
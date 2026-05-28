import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'dotenv/config';
import {
  and,
  asc,
  companies,
  db,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  years,
} from 'db';

const runningInBun = typeof Bun !== 'undefined' && typeof Bun.serve === 'function';
const historicalCache = 'public, s-maxage=86400, stale-while-revalidate=604800';

type SortKey =
  | 'name'
  | 'totalIncome'
  | 'profit'
  | 'employeeCount'
  | 'averagePay'
  | 'incomePerEmployee';
type SortDirection = 'asc' | 'desc';

const sortColumns = {
  name: companies.name,
  totalIncome: companies.totalIncome,
  profit: companies.profit,
  employeeCount: companies.employeeCount,
  averagePay: companies.averagePay,
  incomePerEmployee: companies.incomePerEmployee,
} as const;

const app = new Hono();

app.use(logger());
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'OPTIONS'],
  }),
);

function parsePositiveInt(value: string | null, fallback: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  const normalized = Math.floor(parsed);
  return max ? Math.min(normalized, max) : normalized;
}

function parseOptionalNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSort(value: string | null): SortKey {
  return value && value in sortColumns ? (value as SortKey) : 'totalIncome';
}

function parseDirection(value: string | null): SortDirection {
  return value === 'asc' ? 'asc' : 'desc';
}

function companySortOrder(sort: SortKey, dir: SortDirection) {
  const sortColumn = sortColumns[sort];
  return dir === 'asc' ? asc(sortColumn) : sql`${sortColumn} desc nulls last`;
}

function toNumber(value: unknown) {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumberOrNull(value: unknown) {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function setHistoricalCache(c: Context) {
  c.header('Cache-Control', historicalCache);
}

async function availableYears() {
  const rows = await db
    .select({ yearValue: years.yearValue })
    .from(years)
    .orderBy(desc(years.yearValue));

  return rows.map((row) => row.yearValue);
}

async function resolveYear(requestedYear: string | null) {
  const allYears = await availableYears();
  if (requestedYear) {
    const parsed = Number(requestedYear);
    if (Number.isFinite(parsed) && allYears.includes(parsed)) return parsed;
  }
  return allYears[0];
}

function buildFilterConditions(searchParams: URLSearchParams, yearValue: number) {
  const conditions = [eq(years.yearValue, yearValue)];
  const minRevenue = parseOptionalNumber(searchParams.get('minRevenue'));
  const maxRevenue = parseOptionalNumber(searchParams.get('maxRevenue'));
  const minEmployees = parseOptionalNumber(searchParams.get('minEmployees'));
  const maxEmployees = parseOptionalNumber(searchParams.get('maxEmployees'));
  const sector = searchParams.get('sector')?.trim();
  const category = searchParams.get('category')?.trim();
  const municipality = searchParams.get('municipality')?.trim();
  const q = searchParams.get('q')?.trim();

  if (minRevenue !== undefined) conditions.push(gte(companies.totalIncome, minRevenue));
  if (maxRevenue !== undefined) conditions.push(lte(companies.totalIncome, maxRevenue));
  if (minEmployees !== undefined) conditions.push(gte(companies.employeeCount, minEmployees));
  if (maxEmployees !== undefined) conditions.push(lte(companies.employeeCount, maxEmployees));
  if (sector) conditions.push(eq(companies.sector, sector));
  if (category) conditions.push(eq(companies.activityName, category));
  if (municipality) conditions.push(eq(companies.municipality, municipality));
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(companies.name, pattern),
        ilike(companies.pib, pattern),
        ilike(companies.activityName, pattern),
        ilike(companies.municipality, pattern),
      )!,
    );
  }

  return and(...conditions)!;
}

const companySelect = {
  id: companies.id,
  name: companies.name,
  pib: companies.pib,
  reportId: companies.reportId,
  legalStatus: companies.legalStatus,
  municipality: companies.municipality,
  activityCode: companies.activityCode,
  activityName: companies.activityName,
  sector: companies.sector,
  parseStatus: companies.parseStatus,
  totalIncome: companies.totalIncome,
  profit: companies.profit,
  employeeCount: companies.employeeCount,
  netPayCosts: companies.netPayCosts,
  averagePay: companies.averagePay,
  incomePerEmployee: companies.incomePerEmployee,
  yearId: companies.yearId,
  yearValue: years.yearValue,
};

function normalizeCompanyRow(row: any) {
  return {
    ...row,
    year: String(row.yearValue),
    totalIncome: toNumberOrNull(row.totalIncome),
    profit: toNumberOrNull(row.profit),
    employeeCount: toNumberOrNull(row.employeeCount),
    netPayCosts: toNumberOrNull(row.netPayCosts),
    averagePay: toNumberOrNull(row.averagePay),
    incomePerEmployee: toNumberOrNull(row.incomePerEmployee),
  };
}

async function fetchCompanyPage(searchParams: URLSearchParams) {
  const yearValue = await resolveYear(searchParams.get('year'));
  const page = parsePositiveInt(searchParams.get('page'), 1);
  const pageSize = parsePositiveInt(searchParams.get('pageSize'), 50, 200);
  const sort = parseSort(searchParams.get('sort'));
  const dir = parseDirection(searchParams.get('dir'));
  const whereClause = buildFilterConditions(searchParams, yearValue);
  const offset = (page - 1) * pageSize;

  const [rows, countRows] = await Promise.all([
    db
      .select(companySelect)
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(whereClause)
      .orderBy(companySortOrder(sort, dir), asc(companies.name))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(whereClause),
  ]);

  return {
    year: String(yearValue),
    page,
    pageSize,
    total: Number(countRows[0]?.total ?? 0),
    companies: rows.map(normalizeCompanyRow),
  };
}

async function fetchCompaniesForExport(searchParams: URLSearchParams) {
  const yearValue = await resolveYear(searchParams.get('year'));
  const sort = parseSort(searchParams.get('sort'));
  const dir = parseDirection(searchParams.get('dir'));
  const whereClause = buildFilterConditions(searchParams, yearValue);
  const rows = await db
    .select(companySelect)
    .from(companies)
    .innerJoin(years, eq(companies.yearId, years.id))
    .where(whereClause)
    .orderBy(companySortOrder(sort, dir), asc(companies.name));

  return {
    year: String(yearValue),
    companies: rows.map(normalizeCompanyRow),
  };
}

async function aggregateForYear(searchParams: URLSearchParams, yearValue: number) {
  const whereClause = buildFilterConditions(searchParams, yearValue);
  const rows = await db
    .select({
      companyCount: sql<number>`count(*)::int`,
      totalRevenue: sql<string>`coalesce(sum(${companies.totalIncome}), 0)`,
      totalEmployees: sql<string>`coalesce(sum(${companies.employeeCount}), 0)`,
    })
    .from(companies)
    .innerJoin(years, eq(companies.yearId, years.id))
    .where(whereClause);

  const row = rows[0];
  return {
    year: String(yearValue),
    companyCount: Number(row?.companyCount ?? 0),
    totalRevenue: toNumber(row?.totalRevenue),
    totalEmployees: toNumber(row?.totalEmployees),
  };
}

async function filterOptionCounts(yearValue: number) {
  const baseWhere = eq(years.yearValue, yearValue);
  const [sectors, categories, municipalities] = await Promise.all([
    db
      .select({ value: companies.sector, count: sql<number>`count(*)::int` })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(baseWhere)
      .groupBy(companies.sector)
      .orderBy(asc(companies.sector)),
    db
      .select({ value: companies.activityName, count: sql<number>`count(*)::int` })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(baseWhere)
      .groupBy(companies.activityName)
      .orderBy(asc(companies.activityName)),
    db
      .select({ value: companies.municipality, count: sql<number>`count(*)::int` })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(baseWhere)
      .groupBy(companies.municipality)
      .orderBy(asc(companies.municipality)),
  ]);

  const clean = (rows: Array<{ value: string | null; count: number }>) =>
    rows
      .filter((row): row is { value: string; count: number } => Boolean(row.value?.trim()))
      .map((row) => ({ value: row.value.trim(), count: Number(row.count) }));

  return {
    sectors: clean(sectors),
    categories: clean(categories),
    municipalities: clean(municipalities),
  };
}

app.get('/summary', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const allYears = await availableYears();
    const yearValue = await resolveYear(searchParams.get('year'));
    const currentSummary = await aggregateForYear(searchParams, yearValue);
    const previousYearValue = allYears.find((availableYear) => availableYear < yearValue);
    const previousYear = previousYearValue
      ? await aggregateForYear(searchParams, previousYearValue)
      : undefined;
    const whereClause = buildFilterConditions(searchParams, yearValue);
    const topRows = await db
      .select(companySelect)
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(whereClause)
      .orderBy(companySortOrder('totalIncome', 'desc'), asc(companies.name))
      .limit(20);

    const topCompanies = topRows.map(normalizeCompanyRow);
    const concentrationStats = [5, 10, 20].map((count) => ({
      label: `Top ${count} companies`,
      value: currentSummary.totalRevenue
        ? topCompanies
            .slice(0, count)
            .reduce((sum, company) => sum + (company.totalIncome ?? 0), 0) /
          currentSummary.totalRevenue
        : 0,
    }));

    setHistoricalCache(c);
    return c.json({
      ...currentSummary,
      availableYears: allYears.map(String),
      previousYear,
      concentrationStats,
      filterOptions: await filterOptionCounts(yearValue),
      topCompanies: topCompanies.slice(0, 5),
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

app.get('/companies/:pib', async (c) => {
  const pib = c.req.param('pib');
  if (!pib) return c.json({ error: 'PIB parameter is required' }, 400);

  try {
    const rows = await db
      .select(companySelect)
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(eq(companies.pib, pib))
      .orderBy(asc(years.yearValue));

    if (rows.length === 0) {
      return c.json({ message: 'Company not found for the given PIB' }, 404);
    }

    setHistoricalCache(c);
    return c.json(rows.map(normalizeCompanyRow));
  } catch (error) {
    console.error(`Error fetching data for company PIB ${pib}:`, error);
    return c.json({ error: 'Failed to fetch company data' }, 500);
  }
});

app.get('/companies', async (c) => {
  try {
    const result = await fetchCompanyPage(new URL(c.req.url).searchParams);
    setHistoricalCache(c);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching paginated companies:', error);
    return c.json({ error: 'Failed to fetch company data' }, 500);
  }
});

app.get('/trends', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const yearValue = await resolveYear(searchParams.get('year'));
    const metric = parseSort(searchParams.get('metric'));
    const providedPibs = searchParams
      .get('companyPibs')
      ?.split(',')
      .map((pib) => pib.trim())
      .filter(Boolean);

    const pibs =
      providedPibs && providedPibs.length > 0
        ? providedPibs.slice(0, 20)
        : (
            await db
              .select({ pib: companies.pib })
              .from(companies)
              .innerJoin(years, eq(companies.yearId, years.id))
              .where(buildFilterConditions(searchParams, yearValue))
              .orderBy(companySortOrder(metric, 'desc'), asc(companies.name))
              .limit(5)
          ).map((row) => row.pib);

    if (pibs.length === 0) {
      setHistoricalCache(c);
      return c.json([]);
    }

    const rows = await db
      .select(companySelect)
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(inArray(companies.pib, pibs), lte(years.yearValue, yearValue))!)
      .orderBy(asc(years.yearValue), asc(companies.name));

    const byYear = new Map<string, ReturnType<typeof normalizeCompanyRow>[]>();
    for (const row of rows.map(normalizeCompanyRow)) {
      const bucket = byYear.get(row.year) ?? [];
      bucket.push(row);
      byYear.set(row.year, bucket);
    }

    setHistoricalCache(c);
    return c.json(
      Array.from(byYear.entries()).map(([year, companyList]) => ({
        year,
        companyList,
      })),
    );
  } catch (error) {
    console.error('Error fetching trends:', error);
    return c.json({ error: 'Failed to fetch trends' }, 500);
  }
});

app.get('/export.csv', async (c) => {
  try {
    const result = await fetchCompaniesForExport(new URL(c.req.url).searchParams);
    const headers = [
      'PIB',
      'Company',
      'Year',
      'Sector',
      'Category',
      'Municipality',
      'Total Income',
      'Profit',
      'Employees',
      'Avg Pay',
      'Income/Employee',
      'Parse Status',
    ];
    const escapeCsv = (value: unknown) => {
      const text = value == null ? '' : String(value);
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const rows = result.companies.map((company) =>
      [
        company.pib,
        company.name,
        company.year,
        company.sector,
        company.activityName,
        company.municipality,
        company.totalIncome,
        company.profit,
        company.employeeCount,
        company.averagePay,
        company.incomePerEmployee,
        company.parseStatus,
      ].map(escapeCsv).join(','),
    );

    c.header('Content-Type', 'text/csv; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="companies_${result.year}.csv"`);
    c.header('X-Export-Row-Count', String(result.companies.length));
    setHistoricalCache(c);
    return c.body([headers.join(','), ...rows].join('\n'));
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return c.json({ error: 'Failed to export CSV' }, 500);
  }
});

app.get('/years', async (c) => {
  try {
    setHistoricalCache(c);
    return c.json((await availableYears()).map(String));
  } catch (error) {
    console.error('Error fetching years:', error);
    return c.json({ error: 'Failed to fetch years' }, 500);
  }
});

app.get('/', (c) => {
  return c.json({ message: 'IT Stats API', endpoints: ['/summary', '/companies', '/trends'] });
});

const appRoutes = app.basePath('/api');

appRoutes.get('/protected', (c) => {
  return c.json({ message: 'This is a protected route' });
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isDev = process.env.NODE_ENV !== 'production';

console.log(`API server starting on port ${port} (${isDev ? 'development' : 'production'})`);

export default app;

if (!runningInBun && typeof require !== 'undefined' && require.main === module) {
  const { serve } = require('@hono/node-server');

  serve({
    fetch: app.fetch,
    port,
    hostname: isDev ? 'localhost' : '0.0.0.0',
  });

  console.log(`Server is running on http://${isDev ? 'localhost' : '0.0.0.0'}:${port}`);
}

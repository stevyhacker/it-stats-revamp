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
  isNotNull,
  lte,
  or,
  sql,
  years,
} from 'db';
import { parseRegionTrendMetric, revenuePerEmployee, weightedAvgPay } from './regions';
import { parseSectorMetric, profitMargin } from './sectors';
import {
  CAGR_REVENUE_FLOOR,
  YOY_EMPLOYEE_FLOOR,
  YOY_REVENUE_FLOOR,
  parseMoverMetric,
} from './movers';

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

function resolveYearFromYears(requestedYear: string | null, allYears: number[]) {
  if (requestedYear) {
    const parsed = Number(requestedYear);
    if (Number.isFinite(parsed) && allYears.includes(parsed)) return parsed;
  }
  return allYears[0];
}

async function resolveYear(requestedYear: string | null) {
  return resolveYearFromYears(requestedYear, await availableYears());
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
    const yearValue = resolveYearFromYears(searchParams.get('year'), allYears);
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

app.get('/regions', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const yearValue = await resolveYear(searchParams.get('year'));
    const rows = await db
      .select({
        municipality: companies.municipality,
        companyCount: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
        totalProfit: sql<string>`coalesce(sum(${companies.profit}),0)`,
        totalEmployees: sql<string>`coalesce(sum(${companies.employeeCount}),0)`,
        payWeight: sql<string>`coalesce(sum(${companies.averagePay}::bigint * coalesce(${companies.employeeCount},0)),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, yearValue), isNotNull(companies.municipality)))
      .groupBy(companies.municipality)
      .orderBy(sql`coalesce(sum(${companies.totalIncome}),0) desc`);

    const municipalities = rows
      .filter((r) => r.municipality && r.municipality.trim())
      .map((r) => {
        const totalRevenue = toNumber(r.totalRevenue);
        const totalEmployees = toNumber(r.totalEmployees);
        const payWeight = toNumber(r.payWeight);
        return {
          municipality: r.municipality!.trim(),
          companyCount: Number(r.companyCount),
          totalRevenue,
          totalProfit: toNumber(r.totalProfit),
          totalEmployees,
          avgPay: weightedAvgPay(payWeight, totalEmployees),
          revenuePerEmployee: revenuePerEmployee(totalRevenue, totalEmployees),
        };
      });

    const national = municipalities.reduce(
      (acc, m) => {
        acc.companyCount += m.companyCount;
        acc.totalRevenue += m.totalRevenue;
        acc.totalProfit += m.totalProfit;
        acc.totalEmployees += m.totalEmployees;
        acc.payWeight += m.avgPay * m.totalEmployees;
        return acc;
      },
      { companyCount: 0, totalRevenue: 0, totalProfit: 0, totalEmployees: 0, payWeight: 0 },
    );

    setHistoricalCache(c);
    return c.json({
      year: String(yearValue),
      national: {
        companyCount: national.companyCount,
        totalRevenue: national.totalRevenue,
        totalProfit: national.totalProfit,
        totalEmployees: national.totalEmployees,
        avgPay: weightedAvgPay(national.payWeight, national.totalEmployees),
        regionCount: municipalities.length,
      },
      municipalities,
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    return c.json({ error: 'Failed to fetch regions' }, 500);
  }
});

app.get('/regions/sectors', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const yearValue = await resolveYear(searchParams.get('year'));
    const limit = parsePositiveInt(searchParams.get('limit'), 8, 25);

    const topRows = await db
      .select({
        municipality: companies.municipality,
        rev: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, yearValue), isNotNull(companies.municipality)))
      .groupBy(companies.municipality)
      .orderBy(sql`coalesce(sum(${companies.totalIncome}),0) desc`)
      .limit(limit);

    const topNames = topRows.map((r) => r.municipality!).filter(Boolean);
    if (topNames.length === 0) {
      setHistoricalCache(c);
      return c.json({ year: String(yearValue), sectors: [], rows: [] });
    }

    const sectorRows = await db
      .select({
        municipality: companies.municipality,
        sector: companies.sector,
        rev: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, yearValue), inArray(companies.municipality, topNames)))
      .groupBy(companies.municipality, companies.sector);

    const sectorSet = new Set<string>();
    const byMun = new Map<string, Record<string, number>>();
    for (const r of sectorRows) {
      const mun = r.municipality!.trim();
      const sector = (r.sector ?? 'Other').trim() || 'Other';
      sectorSet.add(sector);
      const bucket = byMun.get(mun) ?? {};
      bucket[sector] = (bucket[sector] ?? 0) + toNumber(r.rev);
      byMun.set(mun, bucket);
    }

    setHistoricalCache(c);
    return c.json({
      year: String(yearValue),
      sectors: Array.from(sectorSet).sort(),
      rows: topNames.map((mun) => ({ municipality: mun.trim(), bySector: byMun.get(mun.trim()) ?? {} })),
    });
  } catch (error) {
    console.error('Error fetching region sectors:', error);
    return c.json({ error: 'Failed to fetch region sectors' }, 500);
  }
});

app.get('/regions/trends', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const metric = parseRegionTrendMetric(searchParams.get('metric'));
    const limit = parsePositiveInt(searchParams.get('limit'), 6, 12);
    const allYears = await availableYears();
    const latest = allYears[0];

    // Average pay is employee-weighted. Companies is a row count; every other
    // metric is a straight sum over the municipality/year bucket.
    const valueExpr =
      metric === 'companies'
        ? sql<string>`count(*)::int`
        : metric === 'employees'
          ? sql<string>`coalesce(sum(${companies.employeeCount}), 0)`
          : metric === 'profit'
            ? sql<string>`coalesce(sum(${companies.profit}), 0)`
            : metric === 'avgPay'
              ? sql<string>`coalesce(round(sum(coalesce(${companies.averagePay}, 0)::numeric * coalesce(${companies.employeeCount}, 0)) / nullif(sum(coalesce(${companies.employeeCount}, 0)), 0)), 0)`
              : sql<string>`coalesce(sum(${companies.totalIncome}), 0)`;

    const topRows = await db
      .select({
        municipality: companies.municipality,
        v: valueExpr,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, latest), isNotNull(companies.municipality)))
      .groupBy(companies.municipality)
      .orderBy(sql`${valueExpr} desc`)
      .limit(limit);

    const topNames = topRows.map((r) => r.municipality!).filter(Boolean);
    if (topNames.length === 0) {
      setHistoricalCache(c);
      return c.json({ metric, municipalities: [], series: [] });
    }

    const rows = await db
      .select({
        year: years.yearValue,
        municipality: companies.municipality,
        v: valueExpr,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(inArray(companies.municipality, topNames))
      .groupBy(years.yearValue, companies.municipality)
      .orderBy(asc(years.yearValue));

    const byYear = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const y = String(r.year);
      const bucket = byYear.get(y) ?? {};
      bucket[r.municipality!.trim()] = toNumber(r.v);
      byYear.set(y, bucket);
    }

    setHistoricalCache(c);
    return c.json({
      metric,
      municipalities: topNames.map((n) => n.trim()),
      series: Array.from(byYear.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([year, values]) => ({ year, values })),
    });
  } catch (error) {
    console.error('Error fetching region trends:', error);
    return c.json({ error: 'Failed to fetch region trends' }, 500);
  }
});

// Per-sector aggregates for a year (revenue, profit, employees, weighted avg
// pay, revenue/employee, profit margin) plus national totals. `sector` is a
// non-null column defaulting to 'Other'; null/empty values coalesce to 'Other'.
const sectorExpr = sql<string>`coalesce(nullif(trim(${companies.sector}), ''), 'Other')`;

app.get('/sectors', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const yearValue = await resolveYear(searchParams.get('year'));
    const rows = await db
      .select({
        sector: sectorExpr,
        companyCount: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
        totalProfit: sql<string>`coalesce(sum(${companies.profit}),0)`,
        totalEmployees: sql<string>`coalesce(sum(${companies.employeeCount}),0)`,
        payWeight: sql<string>`coalesce(sum(${companies.averagePay}::bigint * coalesce(${companies.employeeCount},0)),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(eq(years.yearValue, yearValue))
      .groupBy(sectorExpr)
      .orderBy(sql`coalesce(sum(${companies.totalIncome}),0) desc`);

    const sectors = rows.map((r) => {
      const totalRevenue = toNumber(r.totalRevenue);
      const totalProfit = toNumber(r.totalProfit);
      const totalEmployees = toNumber(r.totalEmployees);
      const payWeight = toNumber(r.payWeight);
      return {
        sector: r.sector,
        companyCount: Number(r.companyCount),
        totalRevenue,
        totalProfit,
        totalEmployees,
        avgPay: weightedAvgPay(payWeight, totalEmployees),
        revenuePerEmployee: revenuePerEmployee(totalRevenue, totalEmployees),
        profitMargin: profitMargin(totalProfit, totalRevenue),
      };
    });

    const national = sectors.reduce(
      (acc, s) => {
        acc.companyCount += s.companyCount;
        acc.totalRevenue += s.totalRevenue;
        acc.totalProfit += s.totalProfit;
        acc.totalEmployees += s.totalEmployees;
        acc.payWeight += s.avgPay * s.totalEmployees;
        return acc;
      },
      { companyCount: 0, totalRevenue: 0, totalProfit: 0, totalEmployees: 0, payWeight: 0 },
    );

    setHistoricalCache(c);
    return c.json({
      year: String(yearValue),
      national: {
        companyCount: national.companyCount,
        totalRevenue: national.totalRevenue,
        totalProfit: national.totalProfit,
        totalEmployees: national.totalEmployees,
        avgPay: weightedAvgPay(national.payWeight, national.totalEmployees),
        profitMargin: profitMargin(national.totalProfit, national.totalRevenue),
        sectorCount: sectors.length,
      },
      sectors,
    });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    return c.json({ error: 'Failed to fetch sectors' }, 500);
  }
});

// Activity (NACE) breakdown within a single sector for a year. Returns the
// top-N activities by revenue with the remainder folded into an 'Other' row.
app.get('/sectors/activities', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const yearValue = await resolveYear(searchParams.get('year'));
    const sector = searchParams.get('sector')?.trim();
    const limit = parsePositiveInt(searchParams.get('limit'), 12, 25);
    if (!sector) {
      setHistoricalCache(c);
      return c.json({ year: String(yearValue), sector: '', rows: [] });
    }

    const activityExpr = sql<string>`coalesce(nullif(trim(${companies.activityName}), ''), 'Unspecified')`;
    const rows = await db
      .select({
        activityName: activityExpr,
        activityCode: sql<string>`coalesce(max(${companies.activityCode}), '')`,
        companyCount: sql<number>`count(*)::int`,
        totalRevenue: sql<string>`coalesce(sum(${companies.totalIncome}),0)`,
        totalProfit: sql<string>`coalesce(sum(${companies.profit}),0)`,
        totalEmployees: sql<string>`coalesce(sum(${companies.employeeCount}),0)`,
        payWeight: sql<string>`coalesce(sum(${companies.averagePay}::bigint * coalesce(${companies.employeeCount},0)),0)`,
      })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(and(eq(years.yearValue, yearValue), eq(sectorExpr, sector)))
      .groupBy(activityExpr)
      .orderBy(sql`coalesce(sum(${companies.totalIncome}),0) desc`);

    const mapped = rows.map((r) => {
      const totalRevenue = toNumber(r.totalRevenue);
      const totalProfit = toNumber(r.totalProfit);
      const totalEmployees = toNumber(r.totalEmployees);
      const payWeight = toNumber(r.payWeight);
      return {
        activityName: r.activityName,
        activityCode: r.activityCode ?? '',
        companyCount: Number(r.companyCount),
        totalRevenue,
        totalProfit,
        totalEmployees,
        avgPay: weightedAvgPay(payWeight, totalEmployees),
        profitMargin: profitMargin(totalProfit, totalRevenue),
      };
    });

    const top = mapped.slice(0, limit);
    const rest = mapped.slice(limit);
    if (rest.length > 0) {
      const agg = rest.reduce(
        (acc, r) => {
          acc.companyCount += r.companyCount;
          acc.totalRevenue += r.totalRevenue;
          acc.totalProfit += r.totalProfit;
          acc.totalEmployees += r.totalEmployees;
          acc.payWeight += r.avgPay * r.totalEmployees;
          return acc;
        },
        { companyCount: 0, totalRevenue: 0, totalProfit: 0, totalEmployees: 0, payWeight: 0 },
      );
      top.push({
        activityName: 'Other',
        activityCode: '',
        companyCount: agg.companyCount,
        totalRevenue: agg.totalRevenue,
        totalProfit: agg.totalProfit,
        totalEmployees: agg.totalEmployees,
        avgPay: weightedAvgPay(agg.payWeight, agg.totalEmployees),
        profitMargin: profitMargin(agg.totalProfit, agg.totalRevenue),
      });
    }

    setHistoricalCache(c);
    return c.json({ year: String(yearValue), sector, rows: top });
  } catch (error) {
    console.error('Error fetching sector activities:', error);
    return c.json({ error: 'Failed to fetch sector activities' }, 500);
  }
});

// Multi-year metric series for the top-N sectors (ranked by the latest year).
app.get('/sectors/trends', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const metric = parseSectorMetric(searchParams.get('metric'));
    const limit = parsePositiveInt(searchParams.get('limit'), 6, 12);
    const allYears = await availableYears();
    const latest = allYears[0];

    // Employees is a straight sum; avg pay is employee-weighted; margin is a
    // ratio (sum profit / sum revenue); revenue is the default sum.
    const valueExpr =
      metric === 'employees'
        ? sql<string>`coalesce(sum(${companies.employeeCount}), 0)`
        : metric === 'avgPay'
          ? sql<string>`coalesce(round(sum(coalesce(${companies.averagePay}, 0)::numeric * coalesce(${companies.employeeCount}, 0)) / nullif(sum(coalesce(${companies.employeeCount}, 0)), 0)), 0)`
          : metric === 'margin'
            ? sql<string>`coalesce(sum(${companies.profit})::numeric / nullif(sum(${companies.totalIncome}), 0), 0)`
            : sql<string>`coalesce(sum(${companies.totalIncome}), 0)`;

    const topRows = await db
      .select({ sector: sectorExpr, v: valueExpr })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .where(eq(years.yearValue, latest))
      .groupBy(sectorExpr)
      .orderBy(sql`${valueExpr} desc`)
      .limit(limit);

    const topNames = topRows.map((r) => r.sector).filter(Boolean);
    if (topNames.length === 0) {
      setHistoricalCache(c);
      return c.json({ metric, sectors: [], series: [] });
    }

    const rows = await db
      .select({ year: years.yearValue, sector: sectorExpr, v: valueExpr })
      .from(companies)
      .innerJoin(years, eq(companies.yearId, years.id))
      .groupBy(years.yearValue, sectorExpr)
      .orderBy(asc(years.yearValue));

    const byYear = new Map<string, Record<string, number>>();
    for (const r of rows) {
      if (!topNames.includes(r.sector)) continue;
      const y = String(r.year);
      const bucket = byYear.get(y) ?? {};
      bucket[r.sector] = toNumber(r.v);
      byYear.set(y, bucket);
    }

    setHistoricalCache(c);
    return c.json({
      metric,
      sectors: topNames,
      series: Array.from(byYear.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([year, values]) => ({ year, values })),
    });
  } catch (error) {
    console.error('Error fetching sector trends:', error);
    return c.json({ error: 'Failed to fetch sector trends' }, 500);
  }
});

const MOVER_LIMIT = 12;

// Year-over-year gainers and losers, matched by PIB across the selected year
// and the year before it. Only companies that clear the base-year size floors
// qualify (keeps micro-companies with huge % swings off the boards).
app.get('/movers', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const metric = parseMoverMetric(searchParams.get('metric'));
    const limit = parsePositiveInt(searchParams.get('limit'), MOVER_LIMIT, 50);
    const allYears = await availableYears();
    const yearValue = resolveYearFromYears(searchParams.get('year'), allYears);
    const prevYear = allYears.find((y) => y < yearValue) ?? null;

    if (prevYear == null) {
      setHistoricalCache(c);
      return c.json({ metric, year: String(yearValue), prevYear: null, tracked: 0, gainers: [], losers: [] });
    }

    const matchedSql = sql`
      from companies cur
      inner join years cur_year on cur.year_id = cur_year.id
      inner join companies prev on prev.pib = cur.pib
      inner join years prev_year on prev.year_id = prev_year.id
      where cur_year.year_value = ${yearValue}
        and prev_year.year_value = ${prevYear}
    `;
    const currentMetric = sql`
      case ${metric}
        when 'profit' then coalesce(cur.profit, 0)::numeric
        when 'employees' then coalesce(cur.employee_count, 0)::numeric
        when 'pay' then coalesce(cur.average_pay, 0)::numeric
        else coalesce(cur.total_income, 0)::numeric
      end
    `;
    const previousMetric = sql`
      case ${metric}
        when 'profit' then coalesce(prev.profit, 0)::numeric
        when 'employees' then coalesce(prev.employee_count, 0)::numeric
        when 'pay' then coalesce(prev.average_pay, 0)::numeric
        else coalesce(prev.total_income, 0)::numeric
      end
    `;

    const [trackedRows, moverRows] = await Promise.all([
      db.execute(sql`select count(*)::int as tracked ${matchedSql}`),
      db.execute(sql`
        with matched as (
          select
            cur.pib,
            cur.name,
            ${currentMetric} as current,
            ${previousMetric} as previous,
            coalesce(prev.total_income, 0)::numeric as previous_revenue,
            coalesce(prev.employee_count, 0)::numeric as previous_employees
          ${matchedSql}
        ),
        qualified as (
          select
            pib,
            name,
            current,
            previous,
            current - previous as delta,
            case
              when previous = 0 then null
              else (current - previous) / abs(previous)
            end as pct_change,
            case
              when current - previous > 0 then 'gain'
              when current - previous < 0 then 'loss'
              else null
            end as side
          from matched
          where previous_revenue >= ${YOY_REVENUE_FLOOR}
            and previous_employees >= ${YOY_EMPLOYEE_FLOOR}
        ),
        ranked as (
          select
            *,
            row_number() over (
              partition by side
              order by
                case when side = 'gain' then delta end desc nulls last,
                case when side = 'loss' then delta end asc nulls last
            ) as rank
          from qualified
          where side is not null
        )
        select pib, name, current, previous, delta, pct_change, side
        from ranked
        where rank <= ${limit}
        order by side, rank
      `),
    ]);

    const tracked = Number((trackedRows as any[])[0]?.tracked ?? 0);
    const toMover = (row: any) => ({
      pib: String(row.pib),
      name: String(row.name),
      current: toNumber(row.current),
      previous: toNumber(row.previous),
      delta: toNumber(row.delta),
      pctChange: row.pct_change == null ? null : toNumber(row.pct_change),
    });
    const gainers = (moverRows as any[]).filter((row) => row.side === 'gain').map(toMover);
    const losers = (moverRows as any[]).filter((row) => row.side === 'loss').map(toMover);

    setHistoricalCache(c);
    return c.json({ metric, year: String(yearValue), prevYear: String(prevYear), tracked, gainers, losers });
  } catch (error) {
    console.error('Error fetching movers:', error);
    return c.json({ error: 'Failed to fetch movers' }, 500);
  }
});

// Fastest-growing companies by revenue CAGR over their full observed span
// (first year they appear -> latest). Revenue only, since CAGR needs positive
// endpoints; gated by a first-year revenue floor and a >= 2-year span.
app.get('/movers/cagr', async (c) => {
  try {
    const searchParams = new URL(c.req.url).searchParams;
    const limit = parsePositiveInt(searchParams.get('limit'), 15, 50);
    const allYears = await availableYears();
    const latestYear = allYears[0];

    const rows = await db.execute(sql`
      with endpoint_years as (
        select
          c.pib,
          min(y.year_value) as first_year,
          max(y.year_value) as latest_year
        from companies c
        inner join years y on y.id = c.year_id
        where c.total_income > 0
        group by c.pib
      )
      select
        latest.pib,
        latest.name,
        endpoint_years.first_year,
        endpoint_years.latest_year,
        endpoint_years.latest_year - endpoint_years.first_year as span,
        first.total_income::numeric as first,
        latest.total_income::numeric as latest,
        power(latest.total_income::numeric / first.total_income::numeric, 1.0 / (endpoint_years.latest_year - endpoint_years.first_year)) - 1 as cagr
      from endpoint_years
      inner join years first_year on first_year.year_value = endpoint_years.first_year
      inner join years latest_year on latest_year.year_value = endpoint_years.latest_year
      inner join companies first
        on first.pib = endpoint_years.pib
        and first.year_id = first_year.id
      inner join companies latest
        on latest.pib = endpoint_years.pib
        and latest.year_id = latest_year.id
      where endpoint_years.latest_year - endpoint_years.first_year >= 2
        and first.total_income >= ${CAGR_REVENUE_FLOOR}
      order by cagr desc
      limit ${limit}
    `);

    const out = (rows as any[]).map((row) => ({
      pib: String(row.pib),
      name: String(row.name),
      firstYear: toNumber(row.first_year),
      latestYear: toNumber(row.latest_year),
      span: toNumber(row.span),
      first: toNumber(row.first),
      latest: toNumber(row.latest),
      cagr: toNumber(row.cagr),
    }));

    setHistoricalCache(c);
    return c.json({ latestYear: String(latestYear), rows: out });
  } catch (error) {
    console.error('Error fetching movers CAGR:', error);
    return c.json({ error: 'Failed to fetch movers CAGR' }, 500);
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
  return c.json({
    message: 'IT Stats API',
    endpoints: [
      '/summary',
      '/companies',
      '/trends',
      '/regions',
      '/regions/sectors',
      '/regions/trends',
      '/sectors',
      '/sectors/activities',
      '/sectors/trends',
      '/movers',
      '/movers/cagr',
      '/export.csv',
      '/years',
    ],
  });
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

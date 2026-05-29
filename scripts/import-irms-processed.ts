import { createReadStream, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { Pool } from 'pg';
import { deriveSector, parseActivity } from '../apps/web/src/lib/company-filters';

interface RawCompanyInput {
  [key: string]: unknown;
  year?: string | number;
  periodYear?: string | number;
  period_year?: string | number;
  reportYear?: string | number;
  companyList?: RawCompanyInput[];
}

interface NormalizedCompany {
  year: number;
  pib: string;
  reportId: string | null;
  name: string;
  legalStatus: string | null;
  municipality: string | null;
  activityCode: string | null;
  activityName: string | null;
  sector: string;
  totalIncome: number | null;
  profit: number | null;
  employeeCount: number | null;
  netPayCosts: number | null;
  averagePay: number | null;
  incomePerEmployee: number | null;
  parseStatus: string | null;
}

interface ImportOptions {
  inputPath: string;
  maxYear: number;
  chunkSize: number;
  includeCurrentYear: boolean;
  includePreduzetnik: boolean;
  includeLowAveragePay: boolean;
}

function usage() {
  console.log(`Usage: bun run scripts/import-irms-processed.ts <processed.jsonl|companies.json> [options]

Options:
  --max-year=YYYY           Highest statement year to import. Defaults to current year - 1.
  --chunk-size=N            Batched insert size. Defaults to 500.
  --include-current-year    Allow current-year filings.
  --include-preduzetnik     Include legalStatus matching Preduzetnik.
  --include-low-pay         Include rows where averagePay < 300.
`);
}

function parseArgs(argv: string[]): ImportOptions {
  if (argv.includes('--help') || argv.includes('-h')) {
    usage();
    process.exit(0);
  }

  const inputPath = argv.find((arg) => !arg.startsWith('--'));
  if (!inputPath) {
    usage();
    process.exit(1);
  }

  const currentYear = new Date().getFullYear();
  const includeCurrentYear = argv.includes('--include-current-year');
  const maxYearArg = argv.find((arg) => arg.startsWith('--max-year='));
  const chunkArg = argv.find((arg) => arg.startsWith('--chunk-size='));
  const maxYear = maxYearArg
    ? Number(maxYearArg.split('=')[1])
    : includeCurrentYear
      ? currentYear
      : currentYear - 1;
  const chunkSize = chunkArg ? Number(chunkArg.split('=')[1]) : 500;

  return {
    inputPath: resolve(inputPath),
    maxYear: Number.isFinite(maxYear) ? maxYear : currentYear - 1,
    chunkSize: Number.isFinite(chunkSize) && chunkSize > 0 ? Math.floor(chunkSize) : 500,
    includeCurrentYear,
    includePreduzetnik: argv.includes('--include-preduzetnik'),
    includeLowAveragePay: argv.includes('--include-low-pay'),
  };
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.replace(/[^\d.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function extractYear(record: RawCompanyInput, parentYear?: string | number) {
  return firstNumber(
    record.year,
    record.periodYear,
    record.period_year,
    record.reportYear,
    record.statementYear,
    parentYear,
  );
}

function normalizeLegalFormText(value: string | null) {
  if (!value) return value;

  return value
    .replace(/(?:DR)?DRU[ŠS]TVO\s+SA\s+OGRANI[ČC]ENOM\s+ODGOVORNO[ŠS][ĆC]U/giu, 'D.O.O.')
    .replace(/(?:DR)?DRU[ŠS]TVO\s+SA\s+OGRANI[ČC]ENOM\s+ODG\.?\b/giu, 'D.O.O.')
    .replace(/\bD\.?\s*O\.?\s*O\.?/giu, 'D.O.O.')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,;:])/g, '$1')
    .trim();
}

function normalizeRecord(
  record: RawCompanyInput,
  options: ImportOptions,
  parentYear?: string | number,
): NormalizedCompany | null {
  const year = extractYear(record, parentYear);
  if (!year || year > options.maxYear) return null;

  const legalStatus = normalizeLegalFormText(firstString(record.legalStatus, record.legal_status, record.status));
  if (!options.includePreduzetnik && /preduzetnik/i.test(legalStatus ?? '')) return null;

  const averagePay = firstNumber(record.averagePay, record.average_pay, record.avgPay, record.avg_pay);
  if (!options.includeLowAveragePay && averagePay != null && averagePay < 300) return null;

  const parsedActivity = parseActivity(firstString(record.activity, record.activity_label));
  const activityCode = firstString(
    record.activityCode,
    record.activity_code,
    record.naceCode,
    record.nace_code,
    parsedActivity.activityCode,
  );
  const activityName = firstString(
    record.activityName,
    record.activity_name,
    record.naceName,
    record.nace_name,
    parsedActivity.activityName,
  );
  const pib = firstString(
    record.pib,
    record.PIB,
    record.taxpayerPib,
    record.taxpayer_pib,
    record.identificationNumber,
    record.identification_number,
  );
  const name = normalizeLegalFormText(firstString(record.name, record.companyName, record.company_name, record.taxpayerName));

  if (!pib || !name) return null;

  const employeeCount = firstNumber(record.employeeCount, record.employee_count, record.employees);
  const totalIncome = firstNumber(record.totalIncome, record.total_income, record.revenue);
  const incomePerEmployee = firstNumber(record.incomePerEmployee, record.income_per_employee) ??
    (employeeCount && totalIncome ? Math.round(totalIncome / employeeCount) : null);

  return {
    year: Math.trunc(year),
    pib,
    reportId: firstString(record.reportId, record.report_id, record.statementId, record.statement_id),
    name,
    legalStatus,
    municipality: firstString(record.municipality, record.opstina, record.city),
    activityCode,
    activityName,
    sector: deriveSector(activityCode, activityName),
    totalIncome,
    profit: firstNumber(record.profit, record.netProfit, record.net_profit),
    employeeCount,
    netPayCosts: firstNumber(record.netPayCosts, record.net_pay_costs),
    averagePay: averagePay == null ? null : Math.round(averagePay),
    incomePerEmployee,
    parseStatus: firstString(record.parseStatus, record.parse_status),
  };
}

async function* readRecords(inputPath: string): AsyncGenerator<RawCompanyInput> {
  if (inputPath.endsWith('.jsonl')) {
    const rl = createInterface({
      input: createReadStream(inputPath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      yield JSON.parse(trimmed) as RawCompanyInput;
    }
    return;
  }

  const parsed = JSON.parse(readFileSync(inputPath, 'utf8')) as RawCompanyInput[] | RawCompanyInput;
  const records = Array.isArray(parsed) ? parsed : [parsed];
  for (const record of records) {
    if (Array.isArray(record.companyList)) {
      for (const company of record.companyList) {
        yield { ...company, year: company.year ?? record.year };
      }
    } else {
      yield record;
    }
  }
}

async function ensureYears(client: Awaited<ReturnType<Pool['connect']>>, years: number[]) {
  if (years.length === 0) return;
  await client.query(
    `
      INSERT INTO years (year_value)
      SELECT unnest($1::int[])
      ON CONFLICT (year_value) DO NOTHING
    `,
    [years],
  );
}

async function insertChunk(client: Awaited<ReturnType<Pool['connect']>>, rows: NormalizedCompany[]) {
  if (rows.length === 0) return;
  const yearsInChunk = Array.from(new Set(rows.map((row) => row.year)));
  await ensureYears(client, yearsInChunk);

  const values: unknown[] = [];
  const placeholders = rows
    .map((row, rowIndex) => {
      const offset = rowIndex * 16;
      values.push(
        row.pib,
        row.year,
        row.reportId,
        row.name,
        row.legalStatus,
        row.municipality,
        row.activityCode,
        row.activityName,
        row.sector,
        row.totalIncome,
        row.profit,
        row.employeeCount,
        row.netPayCosts,
        row.averagePay,
        row.incomePerEmployee,
        row.parseStatus,
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16})`;
    })
    .join(',\n');

  await client.query(
    `
      WITH input (
        pib,
        year_value,
        report_id,
        name,
        legal_status,
        municipality,
        activity_code,
        activity_name,
        sector,
        total_income,
        profit,
        employee_count,
        net_pay_costs,
        average_pay,
        income_per_employee,
        parse_status
      ) AS (
        VALUES ${placeholders}
      )
      INSERT INTO companies (
        pib,
        year_id,
        report_id,
        name,
        legal_status,
        municipality,
        activity_code,
        activity_name,
        sector,
        total_income,
        profit,
        employee_count,
        net_pay_costs,
        average_pay,
        income_per_employee,
        parse_status,
        updated_at
      )
      SELECT
        input.pib::text,
        years.id,
        input.report_id::text,
        input.name::text,
        input.legal_status::text,
        input.municipality::text,
        input.activity_code::text,
        input.activity_name::text,
        coalesce(input.sector::text, 'Other'),
        input.total_income::bigint,
        input.profit::bigint,
        input.employee_count::int,
        input.net_pay_costs::bigint,
        input.average_pay::int,
        input.income_per_employee::bigint,
        input.parse_status::text,
        now()
      FROM input
      JOIN years ON years.year_value = input.year_value::int
      ON CONFLICT (pib, year_id) DO UPDATE SET
        report_id = excluded.report_id,
        name = excluded.name,
        legal_status = excluded.legal_status,
        municipality = excluded.municipality,
        activity_code = excluded.activity_code,
        activity_name = excluded.activity_name,
        sector = excluded.sector,
        total_income = excluded.total_income,
        profit = excluded.profit,
        employee_count = excluded.employee_count,
        net_pay_costs = excluded.net_pay_costs,
        average_pay = excluded.average_pay,
        income_per_employee = excluded.income_per_employee,
        parse_status = excluded.parse_status,
        updated_at = now()
    `,
    values,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();
  const countsByYear = new Map<number, number>();
  let imported = 0;
  let skipped = 0;
  let chunk: NormalizedCompany[] = [];

  try {
    console.log(`Importing ${basename(options.inputPath)} with maxYear=${options.maxYear}`);
    await client.query('BEGIN');

    for await (const record of readRecords(options.inputPath)) {
      const normalized = normalizeRecord(record, options);
      if (!normalized) {
        skipped += 1;
        continue;
      }

      chunk.push(normalized);
      countsByYear.set(normalized.year, (countsByYear.get(normalized.year) ?? 0) + 1);

      if (chunk.length >= options.chunkSize) {
        await insertChunk(client, chunk);
        imported += chunk.length;
        chunk = [];
      }
    }

    if (chunk.length > 0) {
      await insertChunk(client, chunk);
      imported += chunk.length;
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`Imported ${imported} rows, skipped ${skipped} rows.`);
  for (const [year, count] of Array.from(countsByYear.entries()).sort(([a], [b]) => a - b)) {
    console.log(`${year}: ${count} rows`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

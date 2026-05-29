export interface FilterableCompany {
  name: string;
  activityCode?: string | null;
  activityName?: string | null;
  sector?: string | null;
  municipality?: string | null;
  totalIncome?: number | null;
  employeeCount?: number | null;
}

export interface RawCompanyForCleanSubset {
  id?: number | null;
  pib?: string | null;
  maticniBroj?: string | null;
  name: string;
  address?: string | null;
  municipality?: string | null;
  activityCode?: string | null;
  activityName?: string | null;
  activity?: string | null;
  legalStatus?: string | null;
  parseStatus?: string | null;
  employeeCount?: number | null;
  averagePay?: number | null;
  yearId?: number | null;
  totalIncome?: number | null;
  profit?: number | null;
  incomePerEmployee?: number | null;
}

export interface CleanCompanyRecord extends FilterableCompany {
  id: number;
  pib: string;
  maticniBroj: string | null;
  name: string;
  address: string | null;
  municipality: string | null;
  activityCode: string | null;
  activityName: string | null;
  legalStatus: string | null;
  parseStatus: string | null;
  employeeCount: number | null;
  averagePay: number | null;
  yearId: number;
  totalIncome: number | null;
  profit: number | null;
  incomePerEmployee: number | null;
}

export interface RawCompanyYearForCleanSubset {
  year: string | number;
  companyList: RawCompanyForCleanSubset[];
}

export interface CleanCompanyYearRecord {
  year: string;
  companyList: CleanCompanyRecord[];
}

export interface CompanyFiltersState {
  q?: string;
  minRevenue?: string;
  maxRevenue?: string;
  minEmployees?: string;
  maxEmployees?: string;
  sector?: string;
  category?: string;
  municipality?: string;
}

export interface CompanyFilterOptions {
  sectors: string[];
  categories: string[];
  municipalities: string[];
}

const ALL_VALUE = "all";
const SUSPICIOUS_AVERAGE_PAY_CUTOFF = 300;

const SECTOR_RULES: Array<{ label: string; ranges: Array<[number, number]> }> = [
  { label: "Agriculture", ranges: [[1, 3]] },
  { label: "Mining", ranges: [[5, 9]] },
  { label: "Manufacturing", ranges: [[10, 33]] },
  { label: "Utilities", ranges: [[35, 39]] },
  { label: "Construction", ranges: [[41, 43]] },
  { label: "Trade", ranges: [[45, 47]] },
  { label: "Transport & logistics", ranges: [[49, 53]] },
  { label: "Hospitality", ranges: [[55, 56]] },
  { label: "Technology", ranges: [[58, 63]] },
  { label: "Finance & insurance", ranges: [[64, 66]] },
  { label: "Real estate", ranges: [[68, 68]] },
  { label: "Professional services", ranges: [[69, 75]] },
  { label: "Administrative services", ranges: [[77, 82]] },
  { label: "Public & nonprofit", ranges: [[84, 84], [94, 94], [99, 99]] },
  { label: "Education", ranges: [[85, 85]] },
  { label: "Health & social care", ranges: [[86, 88]] },
  { label: "Arts & entertainment", ranges: [[90, 93]] },
  { label: "Personal services", ranges: [[95, 98]] },
];

function normalizeCode(activityCode?: string | null): number | null {
  const match = activityCode?.match(/\d{2}/);
  return match ? Number(match[0]) : null;
}

export function parseActivity(activity?: string | null): { activityCode: string | null; activityName: string | null } {
  if (!activity) {
    return { activityCode: null, activityName: null };
  }

  const match = activity.match(/^\s*(\d{4})\s*,\s*(.*?)\s*$/);
  if (!match) {
    return { activityCode: null, activityName: activity.trim() || null };
  }

  return {
    activityCode: match[1],
    activityName: match[2]?.trim() || null,
  };
}

function isCompletedYear(year: string | number, currentYear: number): boolean {
  const parsed = Number(year);
  return Number.isFinite(parsed) && parsed <= currentYear - 1;
}

function hasSuspiciousAveragePay(company: RawCompanyForCleanSubset): boolean {
  return company.averagePay != null && Number(company.averagePay) < SUSPICIOUS_AVERAGE_PAY_CUTOFF;
}

function isPreduzetnik(company: RawCompanyForCleanSubset): boolean {
  return /preduzetnik/i.test(company.legalStatus ?? "");
}

export function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^D\.O\.O\.\s+(?=\"[^\"]+\"\s+D\.O\.O\.)/i, "")
    .replace(/(^|[\s,;:-])(D\.O\.O\.)\s+(?=D\.O\.O\.(?:[\s,;:-]|$))/gi, "$1");
}

function toCleanCompanyRecord(company: RawCompanyForCleanSubset): CleanCompanyRecord {
  const parsedActivity = parseActivity(company.activity);
  const activityCode = company.activityCode ?? parsedActivity.activityCode;
  const activityName = company.activityName ?? parsedActivity.activityName;

  return {
    id: Number(company.id ?? 0),
    pib: company.pib ?? "",
    maticniBroj: company.maticniBroj ?? null,
    name: normalizeCompanyName(company.name),
    address: company.address ?? null,
    municipality: company.municipality ?? null,
    activityCode,
    activityName,
    legalStatus: company.legalStatus ?? null,
    parseStatus: company.parseStatus ?? null,
    employeeCount: company.employeeCount ?? null,
    averagePay: company.averagePay ?? null,
    yearId: Number(company.yearId ?? 0),
    totalIncome: company.totalIncome ?? null,
    profit: company.profit ?? null,
    incomePerEmployee: company.incomePerEmployee ?? null,
  };
}

export function buildCleanCompanyData(
  rawData: RawCompanyYearForCleanSubset[],
  currentYear = new Date().getFullYear(),
): CleanCompanyYearRecord[] {
  return rawData
    .filter((yearRecord) => isCompletedYear(yearRecord.year, currentYear))
    .map((yearRecord) => ({
      year: String(yearRecord.year),
      companyList: yearRecord.companyList
        .filter((company) => !isPreduzetnik(company))
        .filter((company) => !hasSuspiciousAveragePay(company))
        .map(toCleanCompanyRecord),
    }))
    .filter((yearRecord) => yearRecord.companyList.length > 0)
    .sort((a, b) => Number(b.year) - Number(a.year));
}

export function deriveSector(activityCode?: string | null, activityName?: string | null): string {
  const division = normalizeCode(activityCode);

  if (division !== null) {
    const rule = SECTOR_RULES.find(({ ranges }) =>
      ranges.some(([start, end]) => division >= start && division <= end),
    );
    if (rule) return rule.label;
  }

  const activity = activityName?.toLowerCase() ?? "";
  if (/računar|racunar|softver|program|informacion|internet|portal|hosting/.test(activity)) {
    return "Technology";
  }
  if (/restoran|hotel|ugost|pić|pic|smještaj|smestaj/.test(activity)) {
    return "Hospitality";
  }
  if (/trgovin|prodaj|veleprodaj|maloprodaj/.test(activity)) {
    return "Trade";
  }
  if (/građ|gradj|izgrad|nekretnin/.test(activity)) {
    return "Construction";
  }

  return "Other";
}

function hasConcreteValue(value?: string): value is string {
  return Boolean(value && value !== ALL_VALUE);
}

function parseFilterNumber(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function filterCompanies<T extends FilterableCompany>(
  companies: T[],
  filters: CompanyFiltersState,
): T[] {
  const minRevenue = parseFilterNumber(filters.minRevenue);
  const maxRevenue = parseFilterNumber(filters.maxRevenue);
  const minEmployees = parseFilterNumber(filters.minEmployees);
  const maxEmployees = parseFilterNumber(filters.maxEmployees);

  return companies.filter((company) => {
    const revenue = company.totalIncome ?? 0;
    const employees = company.employeeCount ?? 0;
    const sector = company.sector?.trim() || deriveSector(company.activityCode, company.activityName);
    const category = company.activityName?.trim() ?? "";
    const municipality = company.municipality?.trim() ?? "";
    const searchText = `${company.name} ${category} ${municipality} ${sector}`.toLowerCase();
    const q = filters.q?.trim().toLowerCase();

    if (q && !searchText.includes(q)) return false;
    if (minRevenue !== undefined && revenue < minRevenue) return false;
    if (maxRevenue !== undefined && revenue > maxRevenue) return false;
    if (minEmployees !== undefined && employees < minEmployees) return false;
    if (maxEmployees !== undefined && employees > maxEmployees) return false;
    if (hasConcreteValue(filters.sector) && sector !== filters.sector) return false;
    if (hasConcreteValue(filters.category) && category !== filters.category) return false;
    if (hasConcreteValue(filters.municipality) && municipality !== filters.municipality) return false;

    return true;
  });
}

function sortedUnique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
  ).sort((a, b) => a.localeCompare(b));
}

export function getCompanyFilterOptions(companies: FilterableCompany[]): CompanyFilterOptions {
  return {
    sectors: sortedUnique(companies.map((company) => deriveSector(company.activityCode, company.activityName))),
    categories: sortedUnique(companies.map((company) => company.activityName)),
    municipalities: sortedUnique(companies.map((company) => company.municipality)),
  };
}

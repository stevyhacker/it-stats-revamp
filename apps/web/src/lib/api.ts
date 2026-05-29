import type { CompanyData, YearData } from "@/types";
import type { CompanyFiltersState } from "@/lib/company-filters";

export type CompanySortKey =
  | "name"
  | "totalIncome"
  | "profit"
  | "employeeCount"
  | "averagePay"
  | "incomePerEmployee";

export type SortDirection = "asc" | "desc";

export interface FilterOptionCount {
  value: string;
  count: number;
}

export interface SummaryResponse {
  year: string;
  availableYears: string[];
  companyCount: number;
  totalRevenue: number;
  totalEmployees: number;
  previousYear?: {
    year: string;
    companyCount: number;
    totalRevenue: number;
    totalEmployees: number;
  };
  concentrationStats: Array<{ label: string; value: number }>;
  filterOptions: {
    sectors: FilterOptionCount[];
    categories: FilterOptionCount[];
    municipalities: FilterOptionCount[];
  };
  topCompanies: CompanyData[];
}

export interface CompaniesResponse {
  year: string;
  page: number;
  pageSize: number;
  total: number;
  companies: CompanyData[];
}

export interface CompanyQuery {
  year: string;
  page?: number;
  pageSize?: number;
  sort?: CompanySortKey;
  dir?: SortDirection;
  filters?: CompanyFiltersState;
}

const publicApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3000";
const serverApiBaseUrl =
  process.env.API_URL?.replace(/\/+$/, "") || publicApiBaseUrl;

export function getApiBaseUrl() {
  return typeof window === "undefined" ? serverApiBaseUrl : publicApiBaseUrl;
}

function appendDefined(params: URLSearchParams, key: string, value: string | number | undefined) {
  if (value === undefined || value === "") return;
  params.set(key, String(value));
}

export function buildCompanyParams(query: CompanyQuery) {
  const params = new URLSearchParams();
  appendDefined(params, "year", query.year);
  appendDefined(params, "page", query.page);
  appendDefined(params, "pageSize", query.pageSize);
  appendDefined(params, "sort", query.sort);
  appendDefined(params, "dir", query.dir);

  const filters = query.filters;
  if (filters) {
    appendDefined(params, "q", filters.q?.trim());
    appendDefined(params, "minRevenue", filters.minRevenue);
    appendDefined(params, "maxRevenue", filters.maxRevenue);
    appendDefined(params, "minEmployees", filters.minEmployees);
    appendDefined(params, "maxEmployees", filters.maxEmployees);
    appendDefined(params, "sector", filters.sector);
    appendDefined(params, "category", filters.category);
    appendDefined(params, "municipality", filters.municipality);
  }

  return params;
}

export function apiUrl(path: string, params?: URLSearchParams) {
  const url = new URL(path, `${getApiBaseUrl()}/`);
  if (params) {
    params.forEach((value, key) => url.searchParams.set(key, value));
  }
  return url.toString();
}

export async function fetchApi<T>(
  path: string,
  params?: URLSearchParams,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(apiUrl(path, params), init);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function buildExportUrl(query: CompanyQuery) {
  return apiUrl("/export.csv", buildCompanyParams(query));
}

export type TrendResponse = YearData[];

export type RegionMetric = "revenue" | "companies" | "employees" | "avgPay";

export const REGION_METRICS: { key: RegionMetric; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "companies", label: "Companies" },
  { key: "employees", label: "Employees" },
  { key: "avgPay", label: "Avg pay" },
];

export interface RegionRow {
  municipality: string;
  companyCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalEmployees: number;
  avgPay: number;
  revenuePerEmployee: number;
}

export interface RegionsResponse {
  year: string;
  national: {
    companyCount: number;
    totalRevenue: number;
    totalProfit: number;
    totalEmployees: number;
    avgPay: number;
    regionCount: number;
  };
  municipalities: RegionRow[];
}

export interface RegionSectorsResponse {
  year: string;
  sectors: string[];
  rows: { municipality: string; bySector: Record<string, number> }[];
}

export interface RegionTrendsResponse {
  metric: string;
  municipalities: string[];
  series: { year: string; values: Record<string, number> }[];
}

// Map a RegionMetric to the numeric field on RegionRow.
export function regionMetricValue(row: RegionRow, metric: RegionMetric): number {
  switch (metric) {
    case "companies":
      return row.companyCount;
    case "employees":
      return row.totalEmployees;
    case "avgPay":
      return row.avgPay;
    default:
      return row.totalRevenue;
  }
}

export function buildRegionParams(opts: { year?: string; metric?: RegionMetric; limit?: number }) {
  const params = new URLSearchParams();
  appendDefined(params, "year", opts.year);
  appendDefined(params, "metric", opts.metric);
  appendDefined(params, "limit", opts.limit);
  return params;
}

export type SectorMetric = "revenue" | "employees" | "avgPay" | "margin";

export const SECTOR_METRICS: { key: SectorMetric; label: string }[] = [
  { key: "revenue", label: "Revenue" },
  { key: "employees", label: "Employees" },
  { key: "avgPay", label: "Avg pay" },
  { key: "margin", label: "Margin" },
];

export interface SectorRow {
  sector: string;
  companyCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalEmployees: number;
  avgPay: number;
  revenuePerEmployee: number;
  profitMargin: number;
}

export interface SectorsResponse {
  year: string;
  national: {
    companyCount: number;
    totalRevenue: number;
    totalProfit: number;
    totalEmployees: number;
    avgPay: number;
    profitMargin: number;
    sectorCount: number;
  };
  sectors: SectorRow[];
}

export interface SectorActivityRow {
  activityName: string;
  activityCode: string;
  companyCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalEmployees: number;
  avgPay: number;
  profitMargin: number;
}

export interface SectorActivitiesResponse {
  year: string;
  sector: string;
  rows: SectorActivityRow[];
}

export interface SectorTrendsResponse {
  metric: string;
  sectors: string[];
  series: { year: string; values: Record<string, number> }[];
}

// Map a SectorMetric to the numeric field on SectorRow.
export function sectorMetricValue(row: SectorRow, metric: SectorMetric): number {
  switch (metric) {
    case "employees":
      return row.totalEmployees;
    case "avgPay":
      return row.avgPay;
    case "margin":
      return row.profitMargin;
    default:
      return row.totalRevenue;
  }
}

export function buildSectorParams(opts: {
  year?: string;
  metric?: SectorMetric;
  sector?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  appendDefined(params, "year", opts.year);
  appendDefined(params, "metric", opts.metric);
  appendDefined(params, "sector", opts.sector);
  appendDefined(params, "limit", opts.limit);
  return params;
}

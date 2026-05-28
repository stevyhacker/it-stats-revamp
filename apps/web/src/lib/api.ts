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

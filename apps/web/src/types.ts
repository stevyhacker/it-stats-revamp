export interface CompanyData {
  id?: number;
  name: string;
  pib?: string;
  reportId?: string | null;
  activityCode?: string | null;
  activityName?: string | null;
  legalStatus?: string | null;
  sector?: string | null;
  parseStatus?: string | null;
  totalIncome: number | null;
  profit: number | null;
  employeeCount: number | null;
  municipality?: string | null;
  netPayCosts?: number | null;
  averagePay?: number | string | null;
  incomePerEmployee: number | string | null;
  yearId?: number;
  yearValue?: number;
  year?: string;
}

export interface YearData {
  year: string;
  companyList: CompanyData[];
}

export interface CompanyGrowth {
  name: string;
  growthRate: number;
  latestIncome: number;
}

export interface CompanyEfficiency {
  name: string;
  profitMargin: number;
  revenuePerEmployee: number;
}

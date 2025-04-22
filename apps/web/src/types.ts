export interface CompanyData {
  name: string;
  totalIncome: number;
  profit: number;
  employeeCount: number;
  netPayCosts?: number;
  averagePay?: number | string;
  incomePerEmployee: number | string;
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
export interface CompanyData {
  name: string;
  totalIncome: number;
  profit: number;
  employeeCount: number;
  pib: string;
  netPayCosts?: number;
  averagePay?: number | undefined;
  incomePerEmployee: number | undefined;
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
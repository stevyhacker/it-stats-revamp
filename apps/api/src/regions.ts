export function weightedAvgPay(payWeightSum: number, employees: number): number {
  return employees > 0 ? Math.round(payWeightSum / employees) : 0;
}

export function revenuePerEmployee(revenue: number, employees: number): number {
  return employees > 0 ? Math.round(revenue / employees) : 0;
}

export type RegionTrendMetric = 'revenue' | 'companies' | 'employees' | 'avgPay' | 'profit';

export function parseRegionTrendMetric(value: string | null): RegionTrendMetric {
  switch (value) {
    case 'companies':
      return 'companies';
    case 'employees':
    case 'employeeCount':
      return 'employees';
    case 'avgPay':
    case 'averagePay':
      return 'avgPay';
    case 'profit':
      return 'profit';
    case 'revenue':
    case 'totalIncome':
    default:
      return 'revenue';
  }
}

type CompanyAgg = {
  totalIncome: number | null;
  profit: number | null;
  employeeCount: number | null;
  averagePay: number | null;
};

export type RegionTotals = {
  companyCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalEmployees: number;
  avgPay: number;
  revenuePerEmployee: number;
};

export function accumulateRegion() {
  let companyCount = 0;
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalEmployees = 0;
  let payWeightSum = 0; // sum(averagePay * employeeCount)

  return {
    add(c: CompanyAgg) {
      companyCount += 1;
      totalRevenue += c.totalIncome ?? 0;
      totalProfit += c.profit ?? 0;
      const emp = c.employeeCount ?? 0;
      totalEmployees += emp;
      if (c.averagePay != null && emp > 0) payWeightSum += c.averagePay * emp;
    },
    result(): RegionTotals {
      return {
        companyCount,
        totalRevenue,
        totalProfit,
        totalEmployees,
        avgPay: weightedAvgPay(payWeightSum, totalEmployees),
        revenuePerEmployee: revenuePerEmployee(totalRevenue, totalEmployees),
      };
    },
  };
}

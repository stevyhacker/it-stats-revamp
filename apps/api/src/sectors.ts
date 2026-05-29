// Sector aggregation math. Reuses the employee-weighted pay and
// revenue-per-employee helpers from the regions module so both dashboards
// compute those numbers identically.
export { revenuePerEmployee, weightedAvgPay } from './regions';

/**
 * Profit margin = total profit / total revenue, in [-∞, 1].
 * Guarded so non-positive revenue yields 0 (avoids divide-by-zero and
 * meaningless margins on empty/zero-revenue groups).
 */
export function profitMargin(totalProfit: number, totalRevenue: number): number {
  return totalRevenue > 0 ? totalProfit / totalRevenue : 0;
}

export type SectorMetric = 'revenue' | 'employees' | 'avgPay' | 'margin';

export function parseSectorMetric(value: string | null): SectorMetric {
  switch (value) {
    case 'employees':
    case 'employeeCount':
      return 'employees';
    case 'avgPay':
    case 'averagePay':
      return 'avgPay';
    case 'margin':
    case 'profitMargin':
      return 'margin';
    case 'revenue':
    case 'totalIncome':
    default:
      return 'revenue';
  }
}

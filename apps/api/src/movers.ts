// Movers math: year-over-year change and compound annual growth, plus the
// noise floors that keep micro-companies off the leaderboards.

export const YOY_REVENUE_FLOOR = 100_000;
export const YOY_EMPLOYEE_FLOOR = 5;
export const CAGR_REVENUE_FLOOR = 100_000;

/**
 * Signed change relative to the magnitude of the base value, e.g. 150 from 100
 * is +0.5. Using |previous| keeps the sign meaningful when the base is negative
 * (profit recovering from a loss). Null when the base is 0 (undefined change).
 */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

/**
 * Compound annual growth rate over `years` years. Null unless both endpoints
 * are positive and the span is positive (CAGR is undefined otherwise).
 */
export function cagr(first: number, last: number, years: number): number | null {
  if (first <= 0 || last <= 0 || years <= 0) return null;
  return Math.pow(last / first, 1 / years) - 1;
}

/** A company qualifies for the YoY boards only if its base year clears both floors. */
export function qualifiesYoY(
  baseRevenue: number,
  baseEmployees: number,
  revenueFloor = YOY_REVENUE_FLOOR,
  employeeFloor = YOY_EMPLOYEE_FLOOR,
): boolean {
  return baseRevenue >= revenueFloor && baseEmployees >= employeeFloor;
}

export type MoverMetric = 'revenue' | 'profit' | 'employees' | 'pay';

export function parseMoverMetric(value: string | null): MoverMetric {
  switch (value) {
    case 'profit':
      return 'profit';
    case 'employees':
    case 'employeeCount':
      return 'employees';
    case 'pay':
    case 'avgPay':
    case 'averagePay':
      return 'pay';
    case 'revenue':
    case 'totalIncome':
    default:
      return 'revenue';
  }
}

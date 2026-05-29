import { describe, expect, test } from 'bun:test';
import { weightedAvgPay, revenuePerEmployee, accumulateRegion } from './regions';

describe('region aggregation math', () => {
  test('weightedAvgPay weights by employees', () => {
    // 10 employees @ 1000, 90 employees @ 2000 => 1900
    expect(weightedAvgPay(1000 * 10 + 2000 * 90, 100)).toBe(1900);
  });

  test('weightedAvgPay is 0 with no employees', () => {
    expect(weightedAvgPay(0, 0)).toBe(0);
  });

  test('revenuePerEmployee divides revenue by employees', () => {
    expect(revenuePerEmployee(1_000_000, 50)).toBe(20_000);
  });

  test('revenuePerEmployee is 0 with no employees', () => {
    expect(revenuePerEmployee(1_000_000, 0)).toBe(0);
  });

  test('accumulateRegion sums financials and pay-weight, ignores nulls', () => {
    const acc = accumulateRegion();
    acc.add({ totalIncome: 100, profit: 10, employeeCount: 5, averagePay: 200 });
    acc.add({ totalIncome: null, profit: null, employeeCount: null, averagePay: null });
    acc.add({ totalIncome: 50, profit: -5, employeeCount: 5, averagePay: 400 });
    const r = acc.result();
    expect(r.totalRevenue).toBe(150);
    expect(r.totalProfit).toBe(5);
    expect(r.totalEmployees).toBe(10);
    expect(r.companyCount).toBe(3);
    expect(r.avgPay).toBe(300); // (200*5 + 400*5)/10
    expect(r.revenuePerEmployee).toBe(15); // 150/10
  });
});

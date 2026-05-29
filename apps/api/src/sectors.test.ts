import { describe, expect, test } from 'bun:test';
import { profitMargin, parseSectorMetric } from './sectors';

describe('sector aggregation math', () => {
  test('profitMargin divides profit by revenue', () => {
    expect(profitMargin(10, 100)).toBeCloseTo(0.1);
  });

  test('profitMargin handles negative profit', () => {
    expect(profitMargin(-5, 50)).toBeCloseTo(-0.1);
  });

  test('profitMargin is 0 with zero or negative revenue', () => {
    expect(profitMargin(10, 0)).toBe(0);
    expect(profitMargin(10, -100)).toBe(0);
  });

  test('profitMargin is 0 with zero profit', () => {
    expect(profitMargin(0, 100)).toBe(0);
  });

  test('parseSectorMetric accepts sector metrics and field aliases', () => {
    expect(parseSectorMetric('revenue')).toBe('revenue');
    expect(parseSectorMetric('totalIncome')).toBe('revenue');
    expect(parseSectorMetric('employees')).toBe('employees');
    expect(parseSectorMetric('employeeCount')).toBe('employees');
    expect(parseSectorMetric('avgPay')).toBe('avgPay');
    expect(parseSectorMetric('averagePay')).toBe('avgPay');
    expect(parseSectorMetric('margin')).toBe('margin');
    expect(parseSectorMetric('profitMargin')).toBe('margin');
    expect(parseSectorMetric('unknown')).toBe('revenue');
    expect(parseSectorMetric(null)).toBe('revenue');
  });
});

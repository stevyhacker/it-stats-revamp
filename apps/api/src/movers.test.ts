import { describe, expect, test } from 'bun:test';
import { pctChange, cagr, qualifiesYoY, parseMoverMetric } from './movers';

describe('movers math', () => {
  test('pctChange is signed change over the magnitude of the base', () => {
    expect(pctChange(150, 100)).toBeCloseTo(0.5);
    expect(pctChange(50, 100)).toBeCloseTo(-0.5);
    // profit recovering from a loss: -50 -> 0 is a +100% move relative to |base|
    expect(pctChange(0, -50)).toBeCloseTo(1);
  });

  test('pctChange is null when the base is zero', () => {
    expect(pctChange(100, 0)).toBeNull();
  });

  test('cagr compounds growth over the year span', () => {
    expect(cagr(100, 400, 2)).toBeCloseTo(1); // quadrupled over 2y => 100%/yr
    expect(cagr(100, 100, 5)).toBeCloseTo(0);
  });

  test('cagr is null for non-positive inputs or zero span', () => {
    expect(cagr(0, 100, 2)).toBeNull();
    expect(cagr(100, 0, 2)).toBeNull();
    expect(cagr(100, 200, 0)).toBeNull();
  });

  test('qualifiesYoY requires both base-year floors', () => {
    expect(qualifiesYoY(200_000, 10)).toBe(true);
    expect(qualifiesYoY(50_000, 10)).toBe(false); // revenue too low
    expect(qualifiesYoY(200_000, 3)).toBe(false); // too few employees
  });

  test('parseMoverMetric maps aliases and defaults to revenue', () => {
    expect(parseMoverMetric('revenue')).toBe('revenue');
    expect(parseMoverMetric('totalIncome')).toBe('revenue');
    expect(parseMoverMetric('profit')).toBe('profit');
    expect(parseMoverMetric('employees')).toBe('employees');
    expect(parseMoverMetric('employeeCount')).toBe('employees');
    expect(parseMoverMetric('pay')).toBe('pay');
    expect(parseMoverMetric('averagePay')).toBe('pay');
    expect(parseMoverMetric('unknown')).toBe('revenue');
    expect(parseMoverMetric(null)).toBe('revenue');
  });
});

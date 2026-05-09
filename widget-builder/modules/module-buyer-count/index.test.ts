import { describe, expect, it } from 'vitest';
import { calculateRange, pickInitialCount, pickNextTarget } from './generator';
import { formatCount } from './dom';

describe('module-buyer-count generator', () => {
  it('renders the exact count instead of collapsing it into plus-buckets', () => {
    expect(formatCount(8)).toBe('8');
    expect(formatCount(31)).toBe('31');
    expect(formatCount(44)).toBe('44');
    expect(formatCount(50)).toBe('50');
  });

  it('uses the configured min/max as the actual range', () => {
    const range = calculateRange({
      enabled: true,
      selectors: [{ selector: '.target', insert: 'after' }],
      minCount: 8,
      maxCount: 50,
      updateInterval: 45,
      showForOutOfStock: false,
      backgroundColor: '#000',
      textColor: '#fff',
    });

    expect(range.min).toBe(8);
    expect(range.max).toBe(50);
    expect(range.mean).toBe(29);
  });

  it('produces initial counts without a strong upper-range bias', () => {
    const range = calculateRange({
      enabled: true,
      selectors: [{ selector: '.target', insert: 'after' }],
      minCount: 8,
      maxCount: 50,
      updateInterval: 45,
      showForOutOfStock: false,
      backgroundColor: '#000',
      textColor: '#fff',
    });

    const samples = Array.from({ length: 4000 }, () => pickInitialCount(range));
    const upperBand = samples.filter((value) => value >= 45).length / samples.length;
    const lowerBand = samples.filter((value) => value <= 20).length / samples.length;
    const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;

    expect(new Set(samples).size).toBeGreaterThan(30);
    expect(upperBand).toBeLessThan(0.22);
    expect(lowerBand).toBeGreaterThan(0.22);
    expect(average).toBeGreaterThan(27);
    expect(average).toBeLessThan(31);
  });

  it('picks next targets across the full range and can move both directions', () => {
    const range = calculateRange({
      enabled: true,
      selectors: [{ selector: '.target', insert: 'after' }],
      minCount: 8,
      maxCount: 50,
      updateInterval: 45,
      showForOutOfStock: false,
      backgroundColor: '#000',
      textColor: '#fff',
    });

    const current = 29;
    const samples = Array.from({ length: 4000 }, () => pickNextTarget(current, range));

    expect(samples.some((value) => value < current)).toBe(true);
    expect(samples.some((value) => value > current)).toBe(true);
    expect(samples.every((value) => value >= 8 && value <= 50)).toBe(true);
    expect(new Set(samples).size).toBeGreaterThan(30);
  });
});

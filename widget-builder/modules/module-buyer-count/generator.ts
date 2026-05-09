import { randomInt } from './random';
import type { SocialProofConfig } from './schema';

export type CountRange = {
  min: number;
  max: number;
  mean: number;
  rnd: () => number;
};

export function calculateRange(config: SocialProofConfig): CountRange {
  const baseMin = Math.min(config.minCount, config.maxCount);
  const baseMax = Math.max(config.minCount, config.maxCount);
  return {
    min: baseMin,
    max: baseMax,
    mean: Math.round((baseMin + baseMax) / 2),
    rnd: Math.random,
  };
}

export function pickNextTarget(current: number, range: CountRange): number {
  const { min, max, rnd } = range;
  if (min === max) {
    return min;
  }

  let next = current;
  while (next === current) {
    next = randomInt(min, max, rnd);
  }
  return next;
}

export function pickInitialCount(range: CountRange): number {
  const { min, max, rnd } = range;
  return randomInt(min, max, rnd);
}

export function nextInterval(baseSeconds: number): number {
  const jitter = Math.random() * 10000 - 5000;
  return Math.max(20000, baseSeconds * 1000 + jitter);
}

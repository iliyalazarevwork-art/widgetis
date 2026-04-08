import { mulberry32, seedFromPath, clamp } from './random';
import type { SocialProofConfig } from './schema';

export type CountRange = {
  min: number;
  max: number;
  mean: number;
  rnd: () => number;
};

export function calculateRange(config: SocialProofConfig): CountRange {
  const hour = new Date().getHours();
  const rnd = mulberry32(seedFromPath());

  const baseMin = config.minCount;
  const baseMax = config.maxCount;

  let minMul = 0.2;
  let maxMul = 0.3;

  if (hour >= 6 && hour < 12) {
    minMul = 0.4;
    maxMul = 0.6;
  } else if (hour >= 12 && hour < 18) {
    minMul = 0.65;
    maxMul = 0.85;
  } else if (hour >= 18) {
    minMul = 0.8;
    maxMul = 1.0;
  }

  const min = Math.round(baseMin + (baseMax - baseMin) * minMul);
  const max = Math.round(baseMin + (baseMax - baseMin) * maxMul);
  const mean = Math.round((min + max) / 2);

  return { min, max, mean, rnd };
}

export function pickNextTarget(current: number, range: CountRange): number {
  const { min, max, rnd } = range;

  if (rnd() > 0.3) {
    const inc = Math.floor(rnd() * 5) + 1;
    return clamp(current + inc, min, max);
  }

  const dec = Math.floor(rnd() * 3);
  return clamp(current - dec, min, max);
}

export function nextInterval(baseSeconds: number): number {
  const jitter = Math.random() * 10000 - 5000;
  return Math.max(20000, baseSeconds * 1000 + jitter);
}

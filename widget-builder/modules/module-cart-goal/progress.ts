export function computeProgress(threshold: number, total: number): number {
  if (threshold <= 0) return 0;
  const progress = total / threshold;
  return Math.min(1, Math.max(0, progress));
}


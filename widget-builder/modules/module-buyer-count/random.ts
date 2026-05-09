export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomInt(min: number, max: number, rnd: () => number = Math.random): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

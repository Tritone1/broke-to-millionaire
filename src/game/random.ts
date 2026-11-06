export type RandomSource = { seed: number };

export function normalizeSeed(seed: number): number {
  const value = Math.floor(Math.abs(seed)) >>> 0;
  return value === 0 ? 0x6d2b79f5 : value;
}

export function nextRandom(source: RandomSource): { value: number; next: RandomSource } {
  let state = normalizeSeed(source.seed);
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  const nextSeed = state >>> 0;
  return { value: nextSeed / 0x1_0000_0000, next: { seed: nextSeed } };
}

export function randomInt(source: RandomSource, min: number, max: number): { value: number; next: RandomSource } {
  const draw = nextRandom(source);
  return { value: min + Math.floor(draw.value * (max - min + 1)), next: draw.next };
}

export function shuffle<T>(items: readonly T[], source: RandomSource): { items: T[]; next: RandomSource } {
  const output = [...items];
  let current = source;
  for (let index = output.length - 1; index > 0; index -= 1) {
    const draw = randomInt(current, 0, index);
    current = draw.next;
    const swap = output[index];
    output[index] = output[draw.value]!;
    output[draw.value] = swap!;
  }
  return { items: output, next: current };
}

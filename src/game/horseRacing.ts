import { nextRandom, type RandomSource } from './random';

export type Horse = { id: string; name: string; rating: number; form: number[] };
export type HorseBet =
  | { type: 'win' | 'place' | 'show'; amount: number; horseId: string }
  | { type: 'exacta'; amount: number; horseIds: [string, string] };

export const INITIAL_HORSES: Horse[] = [
  { id: 'comet', name: 'Golden Comet', rating: 86, form: [1, 2, 1] },
  { id: 'velvet', name: 'Velvet Thunder', rating: 78, form: [3, 1, 4] },
  { id: 'rocket', name: 'Midnight Rocket', rating: 82, form: [2, 3, 2] },
  { id: 'fortune', name: 'Fortune Runner', rating: 71, form: [5, 2, 3] },
  { id: 'emerald', name: 'Emerald Dash', rating: 75, form: [4, 4, 1] },
  { id: 'legacy', name: 'Living Legacy', rating: 68, form: [6, 3, 5] },
];

export function horseOdds(horses: Horse[]): Record<string, number> {
  const strengths = horses.map((horse) => {
    const formBonus = horse.form.reduce((sum, position) => sum + Math.max(0, 7 - position), 0) / horse.form.length;
    return { id: horse.id, strength: horse.rating + formBonus * 2 };
  });
  const total = strengths.reduce((sum, item) => sum + item.strength, 0);
  return Object.fromEntries(strengths.map((item) => [item.id, Number(Math.max(1.15, (total / item.strength) * 0.88).toFixed(2))]));
}

export function runHorseRace(horses: Horse[], seed: number): { order: string[]; horses: Horse[]; seed: number } {
  let source: RandomSource = { seed };
  const scored = horses.map((horse) => {
    const draw = nextRandom(source);
    source = draw.next;
    const form = horse.form.reduce((sum, position) => sum + Math.max(0, 7 - position), 0) / horse.form.length;
    return { horse, score: horse.rating + form * 2 + draw.value * 36 };
  }).sort((a, b) => b.score - a.score);
  const order = scored.map((item) => item.horse.id);
  const updated = horses.map((horse) => {
    const position = order.indexOf(horse.id) + 1;
    return { ...horse, form: [position, ...horse.form].slice(0, 5) };
  });
  return { order, horses: updated, seed: source.seed };
}

export function horseBetPayout(bet: HorseBet, order: string[], odds: Record<string, number>): number {
  if (bet.type === 'exacta') {
    return order[0] === bet.horseIds[0] && order[1] === bet.horseIds[1]
      ? bet.amount * (odds[bet.horseIds[0]] ?? 1) * (odds[bet.horseIds[1]] ?? 1) * 1.5
      : 0;
  }
  const position = order.indexOf(bet.horseId) + 1;
  const qualifies = bet.type === 'win' ? position === 1 : bet.type === 'place' ? position > 0 && position <= 2 : position > 0 && position <= 3;
  if (!qualifies) return 0;
  const divisor = bet.type === 'win' ? 1 : bet.type === 'place' ? 2.2 : 3.4;
  return bet.amount * Math.max(1.05, (odds[bet.horseId] ?? 1) / divisor);
}

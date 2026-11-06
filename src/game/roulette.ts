export type RouletteBet =
  | { type: 'straight'; amount: number; number: number }
  | { type: 'split'; amount: number; numbers: [number, number] }
  | { type: 'red' | 'black' | 'odd' | 'even' | 'low' | 'high'; amount: number }
  | { type: 'dozen' | 'column'; amount: number; index: 1 | 2 | 3 };

export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export function roulettePayout(bet: RouletteBet, result: number): number {
  if (result < 0 || result > 36) return 0;
  if (bet.type === 'straight') return result === bet.number ? bet.amount * 36 : 0;
  if (bet.type === 'split') return bet.numbers.includes(result) ? bet.amount * 18 : 0;
  if (result === 0) return 0;
  if (bet.type === 'red') return RED_NUMBERS.has(result) ? bet.amount * 2 : 0;
  if (bet.type === 'black') return !RED_NUMBERS.has(result) ? bet.amount * 2 : 0;
  if (bet.type === 'odd') return result % 2 === 1 ? bet.amount * 2 : 0;
  if (bet.type === 'even') return result % 2 === 0 ? bet.amount * 2 : 0;
  if (bet.type === 'low') return result <= 18 ? bet.amount * 2 : 0;
  if (bet.type === 'high') return result >= 19 ? bet.amount * 2 : 0;
  if (bet.type === 'dozen') return Math.ceil(result / 12) === bet.index ? bet.amount * 3 : 0;
  if (bet.type === 'column') return ((result - 1) % 3) + 1 === bet.index ? bet.amount * 3 : 0;
  return 0;
}

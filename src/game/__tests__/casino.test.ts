import {
  handValue,
  isBlackjack,
  settleBlackjack,
  splitBlackjack,
  type BlackjackRound,
  type PlayingCard,
} from '../blackjack';
import { horseBetPayout, horseOdds, INITIAL_HORSES, runHorseRace } from '../horseRacing';
import { roulettePayout } from '../roulette';

const card = (rank: PlayingCard['rank'], suit: PlayingCard['suit'], id: string): PlayingCard => ({ rank, suit, id });

describe('blackjack rules', () => {
  it('scores soft aces without busting', () => {
    expect(handValue([card('A', '♠', 'a'), card('9', '♥', 'b'), card('5', '♣', 'c')])).toBe(15);
  });

  it('recognizes a two-card natural and pays 3:2', () => {
    const round: BlackjackRound = {
      shoe: [card('2', '♠', 'shoe')],
      dealer: [card('10', '♦', 'd1'), card('9', '♣', 'd2')],
      hands: [{ cards: [card('A', '♥', 'p1'), card('K', '♠', 'p2')], bet: 100, stood: true, doubled: false }],
      activeHand: 0,
      finished: false,
      payouts: [],
      seed: 1,
    };
    expect(isBlackjack(round.hands[0]!.cards)).toBe(true);
    expect(settleBlackjack(round).payouts[0]).toBe(250);
  });

  it('splits equal ranks into two independently dealt hands', () => {
    const round: BlackjackRound = {
      shoe: [card('3', '♦', 's1'), card('4', '♣', 's2')],
      dealer: [card('10', '♦', 'd1'), card('7', '♣', 'd2')],
      hands: [{ cards: [card('8', '♥', 'p1'), card('8', '♠', 'p2')], bet: 50, stood: false, doubled: false }],
      activeHand: 0,
      finished: false,
      payouts: [],
      seed: 1,
    };
    const split = splitBlackjack(round);
    expect(split.hands).toHaveLength(2);
    expect(split.hands.every((hand) => hand.bet === 50 && hand.cards.length === 2)).toBe(true);
  });
});

describe('European roulette payouts', () => {
  it('pays a straight number at 35:1 plus returned stake', () => {
    expect(roulettePayout({ type: 'straight', amount: 10, number: 17 }, 17)).toBe(360);
  });

  it('keeps even-money bets on zero', () => {
    expect(roulettePayout({ type: 'red', amount: 10 }, 0)).toBe(0);
    expect(roulettePayout({ type: 'even', amount: 10 }, 0)).toBe(0);
  });

  it('supports split, dozen, and column payouts', () => {
    expect(roulettePayout({ type: 'split', amount: 10, numbers: [17, 18] }, 18)).toBe(180);
    expect(roulettePayout({ type: 'dozen', amount: 10, index: 2 }, 17)).toBe(30);
    expect(roulettePayout({ type: 'column', amount: 10, index: 2 }, 17)).toBe(30);
  });
});

describe('horse racing', () => {
  it('generates positive odds and a deterministic complete finishing order', () => {
    const odds = horseOdds(INITIAL_HORSES);
    const first = runHorseRace(INITIAL_HORSES, 12345);
    const second = runHorseRace(INITIAL_HORSES, 12345);
    expect(Object.values(odds).every((value) => value > 1)).toBe(true);
    expect(first.order).toEqual(second.order);
    expect(new Set(first.order).size).toBe(INITIAL_HORSES.length);
  });

  it('pays win, place, show and exacta tickets only when qualified', () => {
    const order = INITIAL_HORSES.map((horse) => horse.id);
    const odds = horseOdds(INITIAL_HORSES);
    expect(horseBetPayout({ type: 'win', amount: 10, horseId: order[0]! }, order, odds)).toBeGreaterThan(10);
    expect(horseBetPayout({ type: 'place', amount: 10, horseId: order[1]! }, order, odds)).toBeGreaterThan(10);
    expect(horseBetPayout({ type: 'show', amount: 10, horseId: order[2]! }, order, odds)).toBeGreaterThan(10);
    expect(horseBetPayout({ type: 'exacta', amount: 10, horseIds: [order[0]!, order[1]!] }, order, odds)).toBeGreaterThan(10);
    expect(horseBetPayout({ type: 'win', amount: 10, horseId: order[5]! }, order, odds)).toBe(0);
  });
});

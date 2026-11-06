import { shuffle } from './random';

export type CardSuit = '♠' | '♥' | '♦' | '♣';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type PlayingCard = { suit: CardSuit; rank: CardRank; id: string };
export type BlackjackHand = { cards: PlayingCard[]; bet: number; stood: boolean; doubled: boolean };

export type BlackjackRound = {
  shoe: PlayingCard[];
  dealer: PlayingCard[];
  hands: BlackjackHand[];
  activeHand: number;
  finished: boolean;
  payouts: number[];
  seed: number;
};

const SUITS: CardSuit[] = ['♠', '♥', '♦', '♣'];
const RANKS: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createShoe(seed: number, decks = 6): { cards: PlayingCard[]; seed: number } {
  const cards: PlayingCard[] = [];
  for (let deck = 0; deck < decks; deck += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) cards.push({ suit, rank, id: `${deck}-${suit}-${rank}` });
    }
  }
  const shuffled = shuffle(cards, { seed });
  return { cards: shuffled.items, seed: shuffled.next.seed };
}

export function handValue(cards: PlayingCard[]): number {
  let value = cards.reduce((sum, card) => sum + (card.rank === 'A' ? 11 : ['K', 'Q', 'J'].includes(card.rank) ? 10 : Number(card.rank)), 0);
  let aces = cards.filter((card) => card.rank === 'A').length;
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }
  return value;
}

export function isBlackjack(cards: PlayingCard[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

function draw(shoe: PlayingCard[]): { card: PlayingCard; shoe: PlayingCard[] } {
  const card = shoe[0];
  if (!card) throw new Error('Blackjack shoe is empty');
  return { card, shoe: shoe.slice(1) };
}

export function startBlackjackRound(bet: number, seed = Date.now()): BlackjackRound {
  const created = createShoe(seed);
  let shoe = created.cards;
  const playerOne = draw(shoe); shoe = playerOne.shoe;
  const dealerOne = draw(shoe); shoe = dealerOne.shoe;
  const playerTwo = draw(shoe); shoe = playerTwo.shoe;
  const dealerTwo = draw(shoe); shoe = dealerTwo.shoe;
  const round: BlackjackRound = {
    shoe,
    dealer: [dealerOne.card, dealerTwo.card],
    hands: [{ cards: [playerOne.card, playerTwo.card], bet, stood: false, doubled: false }],
    activeHand: 0,
    finished: false,
    payouts: [],
    seed: created.seed,
  };
  if (isBlackjack(round.hands[0]!.cards) || isBlackjack(round.dealer)) return settleBlackjack(round);
  return round;
}

function advanceHand(round: BlackjackRound): BlackjackRound {
  const nextIndex = round.hands.findIndex((hand, index) => index > round.activeHand && !hand.stood && handValue(hand.cards) < 21);
  if (nextIndex >= 0) return { ...round, activeHand: nextIndex };
  return settleBlackjack(round);
}

export function hitBlackjack(round: BlackjackRound): BlackjackRound {
  if (round.finished) return round;
  const hand = round.hands[round.activeHand];
  if (!hand) return round;
  const next = draw(round.shoe);
  const updated = { ...hand, cards: [...hand.cards, next.card] };
  const hands = round.hands.map((item, index) => index === round.activeHand ? updated : item);
  const result = { ...round, shoe: next.shoe, hands };
  return handValue(updated.cards) >= 21 ? advanceHand({ ...result, hands: hands.map((item, index) => index === round.activeHand ? { ...item, stood: true } : item) }) : result;
}

export function standBlackjack(round: BlackjackRound): BlackjackRound {
  if (round.finished) return round;
  const hands = round.hands.map((hand, index) => index === round.activeHand ? { ...hand, stood: true } : hand);
  return advanceHand({ ...round, hands });
}

export function doubleBlackjack(round: BlackjackRound): BlackjackRound {
  const hand = round.hands[round.activeHand];
  if (round.finished || !hand || hand.cards.length !== 2) return round;
  const next = draw(round.shoe);
  const hands = round.hands.map((item, index) => index === round.activeHand
    ? { ...item, cards: [...item.cards, next.card], bet: item.bet * 2, doubled: true, stood: true }
    : item);
  return advanceHand({ ...round, shoe: next.shoe, hands });
}

export function splitBlackjack(round: BlackjackRound): BlackjackRound {
  const hand = round.hands[round.activeHand];
  if (round.finished || !hand || hand.cards.length !== 2 || hand.cards[0]!.rank !== hand.cards[1]!.rank) return round;
  const firstDraw = draw(round.shoe);
  const secondDraw = draw(firstDraw.shoe);
  const first: BlackjackHand = { cards: [hand.cards[0]!, firstDraw.card], bet: hand.bet, stood: false, doubled: false };
  const second: BlackjackHand = { cards: [hand.cards[1]!, secondDraw.card], bet: hand.bet, stood: false, doubled: false };
  const hands = [...round.hands.slice(0, round.activeHand), first, second, ...round.hands.slice(round.activeHand + 1)];
  return { ...round, shoe: secondDraw.shoe, hands };
}

export function settleBlackjack(round: BlackjackRound): BlackjackRound {
  let shoe = round.shoe;
  let dealer = round.dealer;
  if (!isBlackjack(dealer)) {
    while (handValue(dealer) < 17) {
      const next = draw(shoe);
      shoe = next.shoe;
      dealer = [...dealer, next.card];
    }
  }
  const dealerValue = handValue(dealer);
  const dealerBlackjack = isBlackjack(dealer);
  const payouts = round.hands.map((hand) => {
    const value = handValue(hand.cards);
    if (value > 21) return 0;
    if (isBlackjack(hand.cards) && !dealerBlackjack) return hand.bet * 2.5;
    if (dealerValue > 21 || value > dealerValue) return hand.bet * 2;
    if (value === dealerValue) return hand.bet;
    return 0;
  });
  return { ...round, shoe, dealer, finished: true, payouts };
}

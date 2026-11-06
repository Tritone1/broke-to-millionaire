import { MARKET_ASSETS, type MarketSector } from '../data/marketAssets';
import { nextRandom, type RandomSource } from './random';

export type MarketSnapshot = {
  prices: Record<string, number>;
  trends: Record<string, number>;
  history: Record<string, number[]>;
  seed: number;
  news: MarketNews[];
};

export type MarketNews = {
  id: string;
  headline: string;
  sector: MarketSector | 'All';
  impact: number;
  timestamp: number;
};

const SECTOR_NEWS: { sector: MarketSector | 'All'; positive: string; negative: string }[] = [
  { sector: 'Tech', positive: 'Breakthrough chip lifts technology shares', negative: 'Security scare hits technology firms' },
  { sector: 'Energy', positive: 'Grid demand boosts energy outlook', negative: 'Oversupply weighs on energy producers' },
  { sector: 'Food', positive: 'Strong harvest improves food margins', negative: 'Supply shortage squeezes food companies' },
  { sector: 'Bank', positive: 'Credit growth lifts the banking sector', negative: 'Loan concerns pressure bank shares' },
  { sector: 'Space', positive: 'Successful launch ignites space rally', negative: 'Launch delay cools space enthusiasm' },
  { sector: 'Health', positive: 'Clinical success lifts health stocks', negative: 'Regulatory review hits health stocks' },
  { sector: 'Media', positive: 'Subscriber boom lifts media firms', negative: 'Advertising slowdown hits media firms' },
  { sector: 'Coin', positive: 'Digital asset adoption sparks a coin rally', negative: 'Risk-off mood hits digital coins' },
  { sector: 'All', positive: 'Global optimism sends markets higher', negative: 'Risk fears trigger a broad selloff' },
];

export function createMarketSnapshot(seed = Date.now()): MarketSnapshot {
  return {
    prices: Object.fromEntries(MARKET_ASSETS.map((asset) => [asset.id, asset.startPrice])),
    trends: Object.fromEntries(MARKET_ASSETS.map((asset) => [asset.id, 0])),
    history: Object.fromEntries(MARKET_ASSETS.map((asset) => [asset.id, [asset.startPrice]])),
    seed,
    news: [],
  };
}

function normalish(source: RandomSource): { value: number; next: RandomSource } {
  const first = nextRandom(source);
  const second = nextRandom(first.next);
  const safeFirst = Math.max(first.value, 0.000001);
  const value = Math.sqrt(-2 * Math.log(safeFirst)) * Math.cos(2 * Math.PI * second.value);
  return { value, next: second.next };
}

export function advanceMarket(snapshot: MarketSnapshot, timestamp = Date.now()): MarketSnapshot {
  let source: RandomSource = { seed: snapshot.seed };
  const eventRoll = nextRandom(source);
  source = eventRoll.next;
  let eventSector: MarketSector | 'All' | null = null;
  let eventImpact = 0;
  let nextNews = snapshot.news;

  if (eventRoll.value < 0.035) {
    const pick = nextRandom(source);
    source = pick.next;
    const template = SECTOR_NEWS[Math.floor(pick.value * SECTOR_NEWS.length)] ?? SECTOR_NEWS[0]!;
    const direction = nextRandom(source);
    source = direction.next;
    eventSector = template.sector;
    eventImpact = (direction.value < 0.5 ? -1 : 1) * (0.025 + direction.value * 0.06);
    const headline = eventImpact > 0 ? template.positive : template.negative;
    nextNews = [{ id: `${timestamp}-${source.seed}`, headline, sector: template.sector, impact: eventImpact, timestamp }, ...snapshot.news].slice(0, 12);
  }

  const prices: Record<string, number> = {};
  const trends: Record<string, number> = {};
  const history: Record<string, number[]> = {};

  for (const asset of MARKET_ASSETS) {
    const noise = normalish(source);
    source = noise.next;
    const previousTrend = snapshot.trends[asset.id] ?? 0;
    const trendDraw = nextRandom(source);
    source = trendDraw.next;
    const trend = Math.max(-0.008, Math.min(0.008, previousTrend * 0.94 + (trendDraw.value - 0.5) * 0.0015));
    const affected = eventSector === 'All' || eventSector === asset.sector;
    const eventMove = affected ? eventImpact : 0;
    const previousPrice = snapshot.prices[asset.id] ?? asset.startPrice;
    const change = trend + noise.value * asset.volatility + eventMove;
    const price = Math.max(0.01, previousPrice * Math.exp(change));
    prices[asset.id] = Number(price.toFixed(price < 1 ? 4 : 2));
    trends[asset.id] = trend;
    history[asset.id] = [...(snapshot.history[asset.id] ?? [previousPrice]), prices[asset.id]!].slice(-36);
  }

  return { prices, trends, history, seed: source.seed, news: nextNews };
}

export function positionProfitLoss(quantity: number, averageBuyPrice: number, currentPrice: number): number {
  return quantity * (currentPrice - averageBuyPrice);
}

export function averagePriceAfterBuy(
  currentQuantity: number,
  currentAverage: number,
  boughtQuantity: number,
  buyPrice: number,
): number {
  const nextQuantity = currentQuantity + boughtQuantity;
  if (nextQuantity <= 0) return 0;
  return (currentQuantity * currentAverage + boughtQuantity * buyPrice) / nextQuantity;
}

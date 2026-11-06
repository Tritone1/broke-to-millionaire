export type MarketSector = 'Tech' | 'Energy' | 'Food' | 'Bank' | 'Space' | 'Health' | 'Media' | 'Coin';
export type MarketAssetKind = 'stock' | 'coin';

export type MarketAssetDefinition = {
  id: string;
  symbol: string;
  name: string;
  kind: MarketAssetKind;
  sector: MarketSector;
  startPrice: number;
  volatility: number;
  dividendYield: number;
};

export const MARKET_ASSETS: MarketAssetDefinition[] = [
  { id: 'novacore', symbol: 'NOVA', name: 'NovaCore Systems', kind: 'stock', sector: 'Tech', startPrice: 42, volatility: 0.012, dividendYield: 0.004 },
  { id: 'quantum', symbol: 'QNTM', name: 'Quantum Forge', kind: 'stock', sector: 'Tech', startPrice: 118, volatility: 0.018, dividendYield: 0 },
  { id: 'pulsar', symbol: 'PLSR', name: 'Pulsar Devices', kind: 'stock', sector: 'Tech', startPrice: 23, volatility: 0.021, dividendYield: 0.002 },
  { id: 'helio', symbol: 'HEL', name: 'Helio Energy', kind: 'stock', sector: 'Energy', startPrice: 65, volatility: 0.011, dividendYield: 0.012 },
  { id: 'tide', symbol: 'TIDE', name: 'TideGrid Power', kind: 'stock', sector: 'Energy', startPrice: 31, volatility: 0.014, dividendYield: 0.009 },
  { id: 'harvest', symbol: 'HRV', name: 'Golden Harvest', kind: 'stock', sector: 'Food', startPrice: 18, volatility: 0.008, dividendYield: 0.014 },
  { id: 'urban', symbol: 'URBN', name: 'Urban Foods', kind: 'stock', sector: 'Food', startPrice: 54, volatility: 0.01, dividendYield: 0.006 },
  { id: 'vault', symbol: 'VLT', name: 'Vault Union Bank', kind: 'stock', sector: 'Bank', startPrice: 88, volatility: 0.009, dividendYield: 0.016 },
  { id: 'atlas', symbol: 'ATLS', name: 'Atlas Capital', kind: 'stock', sector: 'Bank', startPrice: 145, volatility: 0.013, dividendYield: 0.011 },
  { id: 'orbit', symbol: 'ORBT', name: 'Orbit Dynamics', kind: 'stock', sector: 'Space', startPrice: 72, volatility: 0.025, dividendYield: 0 },
  { id: 'lunar', symbol: 'LUNA', name: 'Lunar Freight', kind: 'stock', sector: 'Space', startPrice: 27, volatility: 0.029, dividendYield: 0 },
  { id: 'vitalis', symbol: 'VITA', name: 'Vitalis Labs', kind: 'stock', sector: 'Health', startPrice: 96, volatility: 0.016, dividendYield: 0.005 },
  { id: 'carewell', symbol: 'CARE', name: 'Carewell Group', kind: 'stock', sector: 'Health', startPrice: 39, volatility: 0.012, dividendYield: 0.009 },
  { id: 'echo', symbol: 'ECHO', name: 'Echo Media', kind: 'stock', sector: 'Media', startPrice: 14, volatility: 0.02, dividendYield: 0.003 },
  { id: 'prism', symbol: 'PRSM', name: 'Prism Stream', kind: 'stock', sector: 'Media', startPrice: 61, volatility: 0.018, dividendYield: 0 },
  { id: 'nexacoin', symbol: 'NXC', name: 'NexaCoin', kind: 'coin', sector: 'Coin', startPrice: 12, volatility: 0.055, dividendYield: 0 },
  { id: 'orbitbyte', symbol: 'OBX', name: 'OrbitByte', kind: 'coin', sector: 'Coin', startPrice: 3.4, volatility: 0.072, dividendYield: 0 },
  { id: 'greenchain', symbol: 'GRC', name: 'GreenChain', kind: 'coin', sector: 'Coin', startPrice: 0.82, volatility: 0.065, dividendYield: 0 },
  { id: 'quasar', symbol: 'QSR', name: 'Quasar Token', kind: 'coin', sector: 'Coin', startPrice: 28, volatility: 0.08, dividendYield: 0 },
  { id: 'vaultcoin', symbol: 'VLC', name: 'VaultCoin', kind: 'coin', sector: 'Coin', startPrice: 6.2, volatility: 0.06, dividendYield: 0 },
  { id: 'pixelcash', symbol: 'PXC', name: 'PixelCash', kind: 'coin', sector: 'Coin', startPrice: 1.7, volatility: 0.09, dividendYield: 0 },
  { id: 'aether', symbol: 'AET', name: 'Aether Ledger', kind: 'coin', sector: 'Coin', startPrice: 44, volatility: 0.05, dividendYield: 0 },
  { id: 'flux', symbol: 'FLX', name: 'FluxMint', kind: 'coin', sector: 'Coin', startPrice: 0.24, volatility: 0.11, dividendYield: 0 },
];

export function marketAssetById(id: string): MarketAssetDefinition {
  const result = MARKET_ASSETS.find((asset) => asset.id === id);
  if (!result) throw new Error(`Unknown market asset: ${id}`);
  return result;
}

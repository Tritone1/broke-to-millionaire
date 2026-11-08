export const PURCHASE_PRODUCT_IDS = ['cash_5000', 'cash_25000', 'cash_100000', 'remove_ads'] as const;

export type PurchaseProductId = typeof PURCHASE_PRODUCT_IDS[number];

export type PurchaseProductDefinition = {
  id: PurchaseProductId;
  title: string;
  description: string;
  icon: string;
  cashAmount: number;
  fallbackPrice: string;
  kind: 'consumable' | 'non_consumable';
};

export const PURCHASE_PRODUCTS: PurchaseProductDefinition[] = [
  { id: 'cash_5000', title: '5,000 Cash', description: 'A quick boost for bills and early upgrades.', icon: '💵', cashAmount: 5_000, fallbackPrice: '$0.99', kind: 'consumable' },
  { id: 'cash_25000', title: '25,000 Cash', description: 'Build savings or fund your next life step.', icon: '💰', cashAmount: 25_000, fallbackPrice: '$2.99', kind: 'consumable' },
  { id: 'cash_100000', title: '100,000 Cash', description: 'A major boost for property and business goals.', icon: '🏦', cashAmount: 100_000, fallbackPrice: '$7.99', kind: 'consumable' },
  { id: 'remove_ads', title: 'Remove Automatic Ads', description: 'Permanently removes timed ads. Rewarded ads stay optional.', icon: '🚫', cashAmount: 0, fallbackPrice: '$4.99', kind: 'non_consumable' },
];

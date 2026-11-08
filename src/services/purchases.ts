import { PURCHASE_PRODUCTS, type PurchaseProductId } from '../data/purchases';

export type StoreProduct = {
  id: PurchaseProductId;
  title: string;
  description: string;
  priceString: string;
};

export type PurchaseServiceState = {
  available: boolean;
  products: StoreProduct[];
  removeAds: boolean;
};

export type PurchaseAttempt = {
  completed: boolean;
  cancelled: boolean;
  removeAds: boolean;
};

export async function initializePurchaseService(): Promise<PurchaseServiceState> {
  return {
    available: false,
    products: PURCHASE_PRODUCTS.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      priceString: product.fallbackPrice,
    })),
    removeAds: false,
  };
}
export async function purchaseProduct(_productId: PurchaseProductId): Promise<PurchaseAttempt> {
  return { completed: false, cancelled: false, removeAds: false };
}

export async function restorePurchases(): Promise<PurchaseServiceState> {
  return initializePurchaseService();
}

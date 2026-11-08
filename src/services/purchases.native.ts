import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesError, PurchasesStoreProduct } from 'react-native-purchases';

import { PURCHASE_PRODUCTS, PURCHASE_PRODUCT_IDS, type PurchaseProductId } from '../data/purchases';
import { ensureGuestSession } from './backend/authService';
import type { PurchaseAttempt, PurchaseServiceState, StoreProduct } from './purchases';

type PurchasesSdk = typeof import('react-native-purchases');

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const purchasesSdk: PurchasesSdk | null = IS_EXPO_GO
  ? null
  // RevenueCat is not included in Expo Go. This lazy native load keeps Expo Go usable.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  : require('react-native-purchases') as PurchasesSdk;

let configured = false;
const nativeProducts = new Map<PurchaseProductId, PurchasesStoreProduct>();

function apiKey(): string | null {
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || null;
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || null;
  return null;
}
function ownsRemoveAds(customerInfo: CustomerInfo): boolean {
  return Boolean(customerInfo.entitlements.active.remove_ads)
    || customerInfo.allPurchasedProductIdentifiers.includes('remove_ads');
}

function fallbackProducts(): StoreProduct[] {
  return PURCHASE_PRODUCTS.map((product) => ({
    id: product.id,
    title: product.title,
    description: product.description,
    priceString: product.fallbackPrice,
  }));
}

async function ensureConfigured(): Promise<boolean> {
  if (!purchasesSdk || !apiKey()) return false;
  const Purchases = purchasesSdk.default;
  const session = await ensureGuestSession();
  if (session.status !== 'ready') return false;

  if (!configured) {
    Purchases.configure({ apiKey: apiKey()!, appUserID: session.user.id });
    configured = true;
  } else if (await Purchases.getAppUserID() !== session.user.id) {
    await Purchases.logIn(session.user.id);
  }
  return true;
}

async function loadState(): Promise<PurchaseServiceState> {
  if (!await ensureConfigured()) return { available: false, products: fallbackProducts(), removeAds: false };
  const Purchases = purchasesSdk!.default;
  const [products, customerInfo] = await Promise.all([
    Purchases.getProducts([...PURCHASE_PRODUCT_IDS], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    Purchases.getCustomerInfo(),
  ]);
  nativeProducts.clear();
  for (const product of products) {
    if (PURCHASE_PRODUCT_IDS.includes(product.identifier as PurchaseProductId)) {
      nativeProducts.set(product.identifier as PurchaseProductId, product);
    }
  }
  const productView = PURCHASE_PRODUCTS.map((definition) => {
    const product = nativeProducts.get(definition.id);
    return {
      id: definition.id,
      title: product?.title || definition.title,
      description: product?.description || definition.description,
      priceString: product?.priceString || definition.fallbackPrice,
    };
  });
  return { available: true, products: productView, removeAds: ownsRemoveAds(customerInfo) };
}

export async function initializePurchaseService(): Promise<PurchaseServiceState> {
  return loadState();
}

export async function purchaseProduct(productId: PurchaseProductId): Promise<PurchaseAttempt> {
  if (!await ensureConfigured()) return { completed: false, cancelled: false, removeAds: false };
  const session = await ensureGuestSession();
  if (session.status !== 'ready' || session.user.is_anonymous) {
    throw new Error('Protect your cloud account in Profile before spending real money.');
  }
  const Purchases = purchasesSdk!.default;
  let product = nativeProducts.get(productId);
  if (!product) {
    await loadState();
    product = nativeProducts.get(productId);
  }
  if (!product) throw new Error('This product is not available from Google Play yet.');
  try {
    const result = await Purchases.purchaseStoreProduct(product);
    return { completed: true, cancelled: false, removeAds: ownsRemoveAds(result.customerInfo) };
  } catch (error) {
    const purchaseError = error as Partial<PurchasesError>;
    if (purchaseError.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || purchaseError.userCancelled) {
      return { completed: false, cancelled: true, removeAds: false };
    }
    throw error;
  }
}

export async function restorePurchases(): Promise<PurchaseServiceState> {
  if (!await ensureConfigured()) return { available: false, products: fallbackProducts(), removeAds: false };
  const Purchases = purchasesSdk!.default;
  const customerInfo = await Purchases.restorePurchases();
  const state = await loadState();
  return { ...state, removeAds: ownsRemoveAds(customerInfo) };
}

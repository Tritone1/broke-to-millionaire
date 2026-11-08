import { create } from 'zustand';

import type { PurchaseProductId } from '../data/purchases';
import { ensureGuestSession } from '../services/backend/authService';
import { claimAdRewards, claimIapGrants } from '../services/backend/walletService';
import {
  initializePurchaseService,
  purchaseProduct,
  restorePurchases,
  type StoreProduct,
} from '../services/purchases';
import { useLifeStore } from './lifeStore';
import { useAdAccessStore } from './adAccessStore';

type PurchaseStore = {
  initialized: boolean;
  available: boolean;
  loading: boolean;
  products: StoreProduct[];
  removeAds: boolean;
  message: string | null;
  initialize: () => Promise<void>;
  buy: (productId: PurchaseProductId) => Promise<void>;
  restore: () => Promise<void>;
  syncPendingCash: (retry?: boolean) => Promise<number>;
  clearMessage: () => void;
};

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  initialized: false,
  available: false,
  loading: false,
  products: [],
  removeAds: false,
  message: null,
  initialize: async () => {
    if (get().loading) return;
    set({ loading: true, message: null });
    try {
      const state = await initializePurchaseService();
      set({ ...state, initialized: true });
      useAdAccessStore.getState().setRemoveAds(state.removeAds);
      await get().syncPendingCash(false);
    } catch (error) {
      set({ initialized: true, available: false, message: error instanceof Error ? error.message : 'Purchases are unavailable.' });
    } finally {
      set({ loading: false });
    }
  },
  buy: async (productId) => {
    if (get().loading) return;
    set({ loading: true, message: null });
    try {
      const result = await purchaseProduct(productId);
      if (result.cancelled) {
        set({ message: 'Purchase cancelled.' });
        return;
      }
      if (!result.completed) {
        set({ message: 'Purchases require the Android internal-test build.' });
        return;
      }
      if (productId === 'remove_ads') {
        useAdAccessStore.getState().setRemoveAds(result.removeAds);
        set({ removeAds: result.removeAds, message: result.removeAds ? 'Automatic ads removed permanently.' : 'Purchase received. Refreshing access...' });
      } else {
        const credited = await get().syncPendingCash(true);
        set({ message: credited > 0 ? `$${credited.toLocaleString()} added to your game cash.` : 'Purchase received. Your cash is being verified; use Sync purchases shortly.' });
      }
    } catch (error) {
      set({ message: error instanceof Error ? error.message : 'Purchase failed. No charge was applied.' });
    } finally {
      set({ loading: false });
    }
  },
  restore: async () => {
    if (get().loading) return;
    set({ loading: true, message: null });
    try {
      const state = await restorePurchases();
      set({ ...state, initialized: true });
      useAdAccessStore.getState().setRemoveAds(state.removeAds);
      const credited = await get().syncPendingCash(true);
      set({ message: credited > 0 ? `$${credited.toLocaleString()} restored to your game cash.` : state.removeAds ? 'Ad-free access restored.' : 'Purchases are already up to date.' });
    } catch (error) {
      set({ message: error instanceof Error ? error.message : 'Could not restore purchases.' });
    } finally {
      set({ loading: false });
    }
  },
  syncPendingCash: async (retry = false) => {
    const session = await ensureGuestSession();
    if (session.status !== 'ready') return 0;
    const attempts = retry ? 8 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const [purchaseClaim, adClaim] = await Promise.all([claimIapGrants(), claimAdRewards()]);
      if (purchaseClaim.amount !== 0) {
        useLifeStore.getState().applyVerifiedCashDelta(purchaseClaim.amount);
      }
      if (adClaim.amount !== 0) useLifeStore.getState().applyVerifiedCashDelta(adClaim.amount);
      const totalAdjustment = purchaseClaim.amount + adClaim.amount;
      if (purchaseClaim.claimedCount > 0 || adClaim.claimedCount > 0) return totalAdjustment;
      if (attempt < attempts - 1) await wait(1_250);
    }
    return 0;
  },
  clearMessage: () => set({ message: null }),
}));

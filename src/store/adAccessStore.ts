import { create } from 'zustand';

type AdAccessStore = {
  removeAds: boolean;
  setRemoveAds: (removeAds: boolean) => void;
};

export const useAdAccessStore = create<AdAccessStore>((set) => ({
  removeAds: false,
  setRemoveAds: (removeAds) => set({ removeAds }),
}));

import { create } from 'zustand';
import { getLocalSubscription, type Plan, type SubStatus } from '@services/subscription/subscriptionService';

interface ProStore {
  isPro: boolean;
  plan: Plan;
  status: SubStatus;
  expiresAt: string | null;
  loaded: boolean;
  loadSubscription: () => Promise<void>;
  setSubscription: (plan: Plan, status: SubStatus, expiresAt: string | null) => void;
}

export const useProStore = create<ProStore>((set) => ({
  isPro: false,
  plan: 'free',
  status: 'inactive',
  expiresAt: null,
  loaded: false,

  loadSubscription: async () => {
    const state = await getLocalSubscription();
    set({
      isPro: state.isPro,
      plan: state.plan,
      status: state.status,
      expiresAt: state.expiresAt,
      loaded: true,
    });
  },

  setSubscription: (plan, status, expiresAt) => {
    const isPro = plan !== 'free' && status === 'active';
    set({ isPro, plan, status, expiresAt });
  },
}));

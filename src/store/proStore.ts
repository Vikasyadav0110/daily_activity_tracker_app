import { create } from 'zustand';
import {
  getLocalSubscription,
  isProPlan,
  isPremiumPlusPlan,
  type Plan,
  type SubStatus,
} from '@services/subscription/subscriptionService';

interface ProStore {
  isPro: boolean;
  isPremiumPlus: boolean;
  plan: Plan;
  status: SubStatus;
  expiresAt: string | null;
  loaded: boolean;
  loadSubscription: () => Promise<void>;
  setSubscription: (plan: Plan, status: SubStatus, expiresAt: string | null) => void;
}

export const useProStore = create<ProStore>((set) => ({
  isPro: false,
  isPremiumPlus: false,
  plan: 'free',
  status: 'inactive',
  expiresAt: null,
  loaded: false,

  loadSubscription: async () => {
    const state = await getLocalSubscription();
    set({
      isPro: state.isPro,
      isPremiumPlus: state.isPremiumPlus,
      plan: state.plan,
      status: state.status,
      expiresAt: state.expiresAt,
      loaded: true,
    });
  },

  setSubscription: (plan, status, expiresAt) => {
    const active = status === 'active';
    set({
      isPro: isProPlan(plan) && active,
      isPremiumPlus: isPremiumPlusPlan(plan) && active,
      plan,
      status,
      expiresAt,
    });
  },
}));

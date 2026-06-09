import { create } from 'zustand';
import { getXPState } from '@services/xp/xpEngine';

interface XPStore {
  totalXp: number;
  weekXp: number;
  level: number;
  loaded: boolean;
  loadXP: () => Promise<void>;
  addXP: (amount: number, newLevel: number) => void;
}

export const useXPStore = create<XPStore>((set) => ({
  totalXp: 0,
  weekXp: 0,
  level: 0,
  loaded: false,

  loadXP: async () => {
    const state = await getXPState();
    set({ totalXp: state.totalXp, weekXp: state.weekXp, level: state.level, loaded: true });
  },

  addXP: (amount: number, newLevel: number) =>
    set((s) => ({
      totalXp: s.totalXp + amount,
      weekXp: s.weekXp + amount,
      level: newLevel,
    })),
}));

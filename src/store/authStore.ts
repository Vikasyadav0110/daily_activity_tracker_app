import { create } from 'zustand';
import { AuthUser } from '@services/supabase/authService';

type AuthState = {
  user: AuthUser | null;
  isLocalOnly: boolean;       // true = no account, offline-only mode
  isLoading: boolean;
  hasMigrated: boolean;       // Phase 1 SQLite data uploaded to Supabase
  setUser: (user: AuthUser | null) => void;
  setLocalOnly: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setHasMigrated: (value: boolean) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLocalOnly: true,
  isLoading: true,
  hasMigrated: false,

  setUser: (user) => set({ user, isLocalOnly: user === null }),
  setLocalOnly: (value) => set({ isLocalOnly: value, user: null }),
  setLoading: (value) => set({ isLoading: value }),
  setHasMigrated: (value) => set({ hasMigrated: value }),
  signOut: () => set({ user: null, isLocalOnly: true, hasMigrated: false }),
}));

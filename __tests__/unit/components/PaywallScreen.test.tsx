import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

jest.mock('@store/authStore', () => {
  const state = { user: { id: 'u1', email: 'test@test.com' }, isLocalOnly: false };
  const hook = jest.fn((sel?: (s: typeof state) => unknown) => (sel ? sel(state) : state));
  (hook as unknown as { getState: () => typeof state }).getState = () => state;
  return { useAuthStore: hook };
});

jest.mock('@store/proStore', () => {
  const state = { plan: 'free', isPro: false, isPremiumPlus: false, setSubscription: jest.fn(), loadSubscription: jest.fn() };
  const hook = jest.fn((sel?: (s: typeof state) => unknown) => (sel ? sel(state) : state));
  (hook as unknown as { getState: () => typeof state }).getState = () => state;
  return { useProStore: hook };
});

jest.mock('@store/regionStore', () => {
  const state = { region: { code: 'IN', currency: 'INR', symbol: '₹', taxPercent: 18 }, prices: [] };
  const hook = jest.fn((sel?: (s: typeof state) => unknown) => (sel ? sel(state) : state));
  return {
    useRegionStore: hook,
    formatPrice: (amount: number, _currency: string, symbol: string) => `${symbol}${amount}`,
  };
});

jest.mock('@services/subscription/razorpayService', () => ({
  purchasePlan: jest.fn(() => Promise.resolve({ success: true })),
  restorePurchase: jest.fn(() => Promise.resolve({ restored: false })),
}));

// subscriptionService has no side effects at import — use real module

import { PaywallScreen } from '@screens/paywall/PaywallScreen';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider theme={DefaultTheme}>{children}</PaperProvider>
);

describe('PaywallScreen', () => {
  it('TC-C08: renders without crashing', () => {
    const { toJSON } = render(<PaywallScreen />, { wrapper: Wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('TC-C09: shows free tier features', () => {
    const { getByText } = render(<PaywallScreen />, { wrapper: Wrapper });
    expect(getByText(/Unlimited habits/i)).toBeTruthy();
  });

  it('TC-C10: shows Pro and Premium+ tab options', () => {
    const { getAllByText } = render(<PaywallScreen />, { wrapper: Wrapper });
    expect(getAllByText(/Pro/i).length).toBeGreaterThan(0);
  });
});

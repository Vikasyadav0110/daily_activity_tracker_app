import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider theme={DefaultTheme}>{children}</PaperProvider>
);

describe('LoadingSpinner', () => {
  it('TC-C01: renders without crashing', () => {
    const { toJSON } = render(<LoadingSpinner />, { wrapper: Wrapper });
    expect(toJSON()).not.toBeNull();
  });

  it('TC-C02: renders message when provided', () => {
    const { getByText } = render(<LoadingSpinner message="Loading data..." />, { wrapper: Wrapper });
    expect(getByText('Loading data...')).toBeTruthy();
  });

  it('TC-C03: renders without message when not provided', () => {
    const { queryByText } = render(<LoadingSpinner />, { wrapper: Wrapper });
    expect(queryByText(/./)).toBeNull();
  });
});

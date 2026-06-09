import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Button } from '@components/common/Button';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <PaperProvider theme={DefaultTheme}>{children}</PaperProvider>
);

describe('Button', () => {
  it('TC-C04: renders label text', () => {
    const { getByText } = render(
      <Button label="Save" onPress={() => {}} />,
      { wrapper: Wrapper }
    );
    expect(getByText('Save')).toBeTruthy();
  });

  it('TC-C05: calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button label="Submit" onPress={onPress} testID="submit-btn" />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByTestId('submit-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('TC-C06: does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button label="Disabled" onPress={onPress} disabled testID="disabled-btn" />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByTestId('disabled-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('TC-C07: does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button label="Loading" onPress={onPress} loading testID="loading-btn" />,
      { wrapper: Wrapper }
    );
    fireEvent.press(getByTestId('loading-btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

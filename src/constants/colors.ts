import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const palette = {
  primary: '#6200EE',
  primaryDark: '#3700B3',
  secondary: '#03DAC6',
  secondaryDark: '#018786',
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#B00020',
  errorLight: '#FDECEA',
  streakOrange: '#FF6B35',
  streakGold: '#FFD700',
  heatmapEmpty: '#EBEDF0',
  heatmapLow: '#9BE9A8',
  heatmapMed: '#40C463',
  heatmapHigh: '#30A14E',
  heatmapMax: '#216E39',
  white: '#FFFFFF',
  black: '#000000',
  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    secondary: palette.secondary,
    error: palette.error,
    background: palette.grey50,
    surface: palette.white,
    onBackground: palette.grey900,
    onSurface: palette.grey900,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#BB86FC',
    secondary: '#03DAC6',
    error: '#CF6679',
    background: '#121212',
    surface: '#1E1E1E',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
  },
};

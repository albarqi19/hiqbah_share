import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

// M0.1 route wiring: the Home/Explore tab surface lives under the (tabs) group
// so it can sit alongside plain stack screens (login, dashboard, modules/*)
// that are not part of the tab bar.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="modules/sales" />
        <Stack.Screen name="modules/operations" />
        <Stack.Screen name="modules/qc" />
        <Stack.Screen name="modules/packaging" />
        <Stack.Screen name="modules/inventory" />
        <Stack.Screen name="modules/management" />
      </Stack>
    </ThemeProvider>
  );
}

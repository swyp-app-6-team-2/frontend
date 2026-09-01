import { LogBox, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

// 개발 빌드에서만 뜨는 화면 하단 LogBox 경고 알림 배지를 숨긴다.
// (라이브러리에서 나는 경고는 Metro 터미널에는 그대로 찍힌다. 배포 빌드엔 원래 없음.)
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

// Root Stack: the (tabs) group is the base screen; detail pages (design-system,
// my-trade, …) push on top. Each page renders its own header via <Screen>, so
// the native stack header is hidden.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

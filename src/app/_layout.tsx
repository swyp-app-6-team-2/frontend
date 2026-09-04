import { LogBox, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { QueryProvider } from '@/components/query-provider';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

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
  // 상세 화면 push는 부드러운 fade. reduce-motion이면 전환 없음('none').
  // 탭 4개 루트는 TabBar가 Link push라 fade를 걸면 탭 전환마다 페이드가 껴서
  // 어색하므로 개별로 'none' 유지(전환 없이 즉시 교체).
  const reduceMotion = useReduceMotion();
  const animation = reduceMotion ? 'none' : 'fade';
  return (
    <QueryProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false, animation }}>
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          <Stack.Screen name="home" options={{ animation: 'none' }} />
          <Stack.Screen name="fridge" options={{ animation: 'none' }} />
          <Stack.Screen name="recipes" options={{ animation: 'none' }} />
          <Stack.Screen name="my" options={{ animation: 'none' }} />
        </Stack>
      </ThemeProvider>
    </QueryProvider>
  );
}

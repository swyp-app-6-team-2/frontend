import { useEffect } from 'react';
import { LogBox, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { QueryProvider } from '@/components/query-provider';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { getAccessToken, hydrateTokens, setOnAuthExpired } from '@/lib/api';
import { registerPushToken, subscribeNotificationOpen, subscribeTokenRefresh } from '@/lib/push';

SplashScreen.preventAutoHideAsync();

// 저장소(SecureStore) → 인메모리 토큰 복원. 모듈 로드(=렌더/쿼리보다 먼저) 시 1회 실행해
// 인증 요청 전에 세션을 채운다. (렌더 중 실행하면 React Compiler 규칙 위반)
hydrateTokens();

// 개발 빌드에서만 뜨는 화면 하단 LogBox 경고 알림 배지를 숨긴다.
// (라이브러리에서 나는 경고는 Metro 터미널에는 그대로 찍힌다. 배포 빌드엔 원래 없음.)
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

// Root Stack: the (tabs) group is the base screen; detail pages (design-system,
// cook-complete, …) push on top. Each page renders its own header via <Screen>, so
// the native stack header is hidden.
export default function RootLayout() {
  const colorScheme = useColorScheme();
  // 상세 화면 push는 부드러운 fade. reduce-motion이면 전환 없음('none').
  // 탭 4개 루트는 TabBar가 Link push라 fade를 걸면 탭 전환마다 페이드가 껴서
  // 어색하므로 개별로 'none' 유지(전환 없이 즉시 교체).
  const reduceMotion = useReduceMotion();
  const animation = reduceMotion ? 'none' : 'fade';

  // 토큰 재발급까지 실패하면(세션 만료) 로그인 화면으로. client.ts가 이 콜백을 호출한다.
  const router = useRouter();
  useEffect(() => {
    setOnAuthExpired(() => router.replace('/login'));
    return () => setOnAuthExpired(null);
  }, [router]);

  // FCM 푸시 — 이미 로그인된 세션이면 앱 시작 시 토큰 등록, 갱신 시 재등록, 알림 탭 시 홈으로.
  // (신규 로그인은 login.tsx가 별도로 registerPushToken 호출)
  useEffect(() => {
    if (getAccessToken()) void registerPushToken();
    const unsubRefresh = subscribeTokenRefresh();
    const unsubOpen = subscribeNotificationOpen(() => router.replace('/home'));
    return () => {
      unsubRefresh();
      unsubOpen();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false, animation }}>
              <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
              <Stack.Screen name="home" options={{ animation: 'none' }} />
              <Stack.Screen name="fridge" options={{ animation: 'none' }} />
              <Stack.Screen name="ingredients" options={{ animation: 'none' }} />
              <Stack.Screen name="recipes" options={{ animation: 'none' }} />
              <Stack.Screen name="my" options={{ animation: 'none' }} />
            </Stack>
          </ThemeProvider>
        </QueryProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

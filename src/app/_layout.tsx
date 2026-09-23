import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import { DarkTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { QueryProvider } from '@/components/query-provider';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { getAccessToken, hydrateTokens, notificationApi, setOnAuthExpired } from '@/lib/api';
import { registerPushToken, subscribeNotificationOpen, subscribeTokenRefresh } from '@/lib/push';
import { prewarmSocialAuth } from '@/lib/social-auth';

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

  // 인앱 풀스크린 스플래시(AnimatedSplashOverlay) 제거 — OS 시스템 스플래시만 보여주고
  // 첫 프레임 마운트 직후 네이티브 스플래시를 해제해 바로 로그인/홈으로 직행한다.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // FCM 푸시 — 이미 로그인된 세션이면 앱 시작 시 토큰 등록, 갱신 시 재등록, 알림 탭 시 홈으로.
  // (신규 로그인은 login.tsx가 별도로 registerPushToken 호출)
  useEffect(() => {
    // 소셜 SDK 프리워밍 — 첫 로그인 탭 깜빡 방지(실패해도 조용히 무시).
    void prewarmSocialAuth();
    if (getAccessToken()) void registerPushToken();
    const unsubRefresh = subscribeTokenRefresh();
    const unsubOpen = subscribeNotificationOpen((data) => {
      // 최초 오픈 기록(서버가 읽음 처리). 실패해도 이동엔 영향 없음.
      if (data.notificationId != null) void notificationApi.markOpened(data.notificationId);
      // 딥링크 계약(orca:///home)에서 스킴을 떼 라우터 경로로. 없으면 홈.
      const path = data.deepLink?.replace(/^orca:\/\//, '') || '/home';
      router.replace(path as Parameters<typeof router.replace>[0]);
    });
    return () => {
      unsubRefresh();
      unsubOpen();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Android: keyboard-controller의 네이티브 edge-to-edge 레이어가 Expo 57 기본 edge-to-edge와
          이중 충돌해 앱 전체 터치를 삼켰다(iOS 정상). enabled=false로 Android에선 네이티브 모듈만 끄고
          (provider는 마운트 유지→Screen의 KeyboardAware* 컴포넌트 context 보존), preserveEdgeToEdge로
          Expo가 켜둔 edge-to-edge는 그대로 둔다. iOS는 기본값(enabled) 유지→키보드 회피 동작 무변경. */}
      <KeyboardProvider enabled={Platform.OS !== 'android'} preserveEdgeToEdge>
        <QueryProvider>
          {/* 다크 전용 앱(CLAUDE.md): 시스템 라이트 모드에서도 항상 DarkTheme로 고정해
              네비게이터 배경이 흰색으로 새는 것을 막는다. */}
          <ThemeProvider value={DarkTheme}>
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

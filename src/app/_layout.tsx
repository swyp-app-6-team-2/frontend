import '@/global.css'; // NativeWind 스타일 주입 — 반드시 루트에서 import(제거 시 앱 전역 무스타일)

import { useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import { DarkTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Sentry from '@sentry/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { QueryProvider } from '@/components/query-provider';
import { useAnalyticsIdentify } from '@/hooks/use-api';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { initAnalytics, trackScreen } from '@/lib/analytics';
import { getAccessToken, hydrateTokens, notificationApi, setOnAuthExpired } from '@/lib/api';
import { hydrateGuest } from '@/lib/guest';
import { registerPushToken, subscribeNotificationOpen, subscribeTokenRefresh } from '@/lib/push';
import { prewarmSocialAuth } from '@/lib/social-auth';

SplashScreen.preventAutoHideAsync();

// 저장소(SecureStore) → 인메모리 토큰 복원. 모듈 로드(=렌더/쿼리보다 먼저) 시 1회 실행해
// 인증 요청 전에 세션을 채운다. (렌더 중 실행하면 React Compiler 규칙 위반)
hydrateTokens();
// 게스트 세션 플래그도 함께 복원(로그인 없이 둘러보기 상태 유지).
hydrateGuest();
// Amplitude 제품 분석 초기화(키 있을 때만). 세션은 SDK가 자동 추적, 화면 조회는 아래 라우트 훅에서.
initAnalytics();

// Sentry 에러·크래시 모니터링 — DSN 있을 때만(없으면 no-op). 네이티브 크래시+JS 에러 자동 수집.
// ⚠️ 네이티브 모듈이라 적용하려면 dev client 리빌드 필요. 소스맵은 EAS 빌드 시 플러그인이 처리.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 성능 트레이스 샘플링(운영은 20%)
  });
}

// 개발 빌드에서만 뜨는 화면 하단 LogBox 경고 알림 배지를 숨긴다.
// (라이브러리에서 나는 경고는 Metro 터미널에는 그대로 찍힌다. 배포 빌드엔 원래 없음.)
if (__DEV__) {
  LogBox.ignoreAllLogs();
}

// QueryProvider 내부에서 user_id 식별 훅을 돌리는 전용 컴포넌트(useQuery 컨텍스트 필요).
function AnalyticsIdentify() {
  useAnalyticsIdentify();
  return null;
}

// Root Stack: the (tabs) group is the base screen; detail pages (design-system,
// cook-complete, …) push on top. Each page renders its own header via <Screen>, so
// the native stack header is hidden.
function RootLayout() {
  // 상세 화면 push는 부드러운 fade. reduce-motion이면 전환 없음('none').
  // 탭 4개 루트는 TabBar가 Link push라 fade를 걸면 탭 전환마다 페이드가 껴서
  // 어색하므로 개별로 'none' 유지(전환 없이 즉시 교체).
  const reduceMotion = useReduceMotion();
  const animation = reduceMotion ? 'none' : 'fade';

  // 화면 조회 추적 — 라우트 경로가 바뀔 때마다 기록(이탈율/퍼널의 핵심 신호).
  const pathname = usePathname();
  useEffect(() => {
    trackScreen(pathname);
  }, [pathname]);

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

  // 다크 전용 앱(CLAUDE.md): 시스템 라이트 모드에서도 항상 DarkTheme로 고정해
  // 네비게이터 배경이 흰색으로 새는 것을 막는다.
  const app = (
    <QueryProvider>
      {/* useQuery(/users/me)를 쓰므로 반드시 QueryProvider 안에서 호출(user_id 식별). */}
      <AnalyticsIdentify />
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
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* keyboard-controller 네이티브 레이어가 Android 15+에서 강제되는 Expo 57 edge-to-edge와 충돌해
          실기기 전체 화면이 검게(렌더 실패) 나온다(에뮬 14에선 강제 없어 안 보임). enabled=false로도
          provider가 마운트되면 충돌이 남아 → Android는 KeyboardProvider를 아예 올리지 않는다.
          Screen/inquiry는 Android에서 RN 기본 스크롤/뷰로 폴백(각 파일 참고). iOS는 그대로 유지.
          ⚠️ 트레이드오프: Android 작은 화면에서 키보드가 하단 입력창을 가림(전체 검은화면보다 경미). */}
      {Platform.OS === 'android' ? app : <KeyboardProvider>{app}</KeyboardProvider>}
    </GestureHandlerRootView>
  );
}

// Sentry로 루트를 감싸 라우팅·렌더 에러를 자동 포착(DSN 없으면 init이 no-op이라 영향 없음).
export default Sentry.wrap(RootLayout);

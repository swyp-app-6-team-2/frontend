import { useEffect, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';

import { setTokens } from '@/lib/api/auth-token';
import { queryClient } from '@/lib/query-client';

// RN에는 브라우저 "window focus"가 없어 refetchOnWindowFocus가 동작하려면
// AppState(앱 포그라운드 복귀)를 focusManager에 알려줘야 한다. (TanStack RN 공식 패턴)
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

/** 앱 전역 React Query Provider. _layout에서 최상위로 감싼다. */
export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  // 개발용: 소셜 로그인 없이도 인증 필요한 API(레시피·재료 등)를 테스트하기 위해
  // 더미 accessToken을 주입한다. 백엔드마다 JWT secret이 달라 서명이 맞는 토큰만 통과하므로,
  // 현재 바라보는 백엔드(로컬/dev)에 맞춰 .env.local의 알맞은 토큰을 고른다.
  useEffect(() => {
    const host = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
    const isLocal = /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|172\.\d/.test(host);
    const token = isLocal
      ? process.env.EXPO_PUBLIC_LOCAL_ACCESS_TOKEN
      : process.env.EXPO_PUBLIC_DEV_ACCESS_TOKEN;
    if (__DEV__ && token) {
      setTokens({ accessToken: token });
      return;
    }
    // 데모 배포(TestFlight) 빌드: EXPO_PUBLIC_DEMO_TOKEN이 설정된 경우에만 로그인 우회 주입.
    // 팀 내부 데모 전용 — 모두 같은 계정 데이터를 공유한다.
    // ⚠️ 데모 종료 후 EAS env(production)에서 EXPO_PUBLIC_DEMO_TOKEN을 반드시 제거할 것.
    const demoToken = process.env.EXPO_PUBLIC_DEMO_TOKEN;
    if (demoToken) setTokens({ accessToken: demoToken });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

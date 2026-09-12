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

  // 개발용: .env.local의 EXPO_PUBLIC_DEV_ACCESS_TOKEN을 주입하면 소셜 로그인 없이도
  // 인증 필요한 API(레시피·재료 등)를 테스트할 수 있다. (백엔드에서 발급받은 토큰 붙여넣기)
  useEffect(() => {
    const devToken = process.env.EXPO_PUBLIC_DEV_ACCESS_TOKEN;
    // 로컬 백엔드일 때만 주입 — dev 서버는 JWT secret이 달라 이 토큰을 거부한다(로그인 필요).
    const host = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
    const isLocal = /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|172\.\d/.test(host);
    if (__DEV__ && devToken && isLocal) setTokens({ accessToken: devToken });
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

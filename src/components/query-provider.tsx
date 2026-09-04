import { useEffect, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';

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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

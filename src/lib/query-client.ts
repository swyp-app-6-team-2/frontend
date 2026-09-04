import { QueryClient } from '@tanstack/react-query';

// 앱 전역 QueryClient. 기본 옵션은 모바일 환경에 맞춰 보수적으로 설정.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분: 그 안엔 캐시를 신선하게 취급(재요청 안 함)
      gcTime: 5 * 60 * 1000, // 5분간 미사용 시 캐시 정리
      retry: 2, // 요청 실패 시 2회까지 재시도
      refetchOnWindowFocus: true, // 앱 포그라운드 복귀 시 재요청(QueryProvider의 focusManager 연동)
    },
    mutations: {
      retry: 0,
    },
  },
});

import { Redirect } from 'expo-router';

import { useOnboarding } from '@/hooks/use-api';
import { getAccessToken } from '@/lib/api';

// 앱 진입점 — 세션이 없으면 로그인, 있으면 온보딩 필요 여부에 따라 온보딩/홈으로.
// _layout 모듈 로드 시 hydrateTokens()가 SecureStore→인메모리 복원을 끝내므로 getAccessToken()은
// 지난 로그인을 반영한다. 온보딩 조회 실패 시엔 사용자를 막지 않고 홈으로(온보딩 루프 방지).
export default function Index() {
  const hasToken = !!getAccessToken();
  const { data, isLoading, isError } = useOnboarding(hasToken);

  if (!hasToken) return <Redirect href="/login" />;
  if (isLoading) return null; // 스플래시가 덮는 동안 대기(라우팅 결정 전)
  return <Redirect href={!isError && data?.onboardingRequired ? '/onboarding' : '/home'} />;
}

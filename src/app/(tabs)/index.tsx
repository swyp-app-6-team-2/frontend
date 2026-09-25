import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { useOnboarding } from '@/hooks/use-api';
import { getAccessToken } from '@/lib/api';
import { isGuest } from '@/lib/guest';

// 앱 진입점 — 세션이 없으면 로그인, 있으면 온보딩 필요 여부에 따라 온보딩/홈으로.
// _layout 모듈 로드 시 hydrateTokens()가 SecureStore→인메모리 복원을 끝내므로 getAccessToken()은
// 지난 로그인을 반영한다. 온보딩 조회 실패 시엔 사용자를 막지 않고 홈으로(온보딩 루프 방지).
export default function Index() {
  const hasToken = !!getAccessToken();
  const guest = isGuest();
  const { data, isLoading, isError } = useOnboarding(hasToken);

  // 게스트(로그인 없이 둘러보기)는 온보딩 없이 홈으로 직행. 로컬 레시피만 다룬다.
  if (guest && !hasToken) return <Redirect href="/home" />;
  if (!hasToken) return <Redirect href="/login" />;
  // 라우팅 결정(온보딩 조회) 전 대기. null을 그리면 라이트 모드 기기에서 네비게이터 흰 배경이
  // 노출되므로, 다크 배경 플레이스홀더로 덮어 흰 화면 플래시를 막는다.
  if (isLoading) return <View className="flex-1 bg-background" />;
  return <Redirect href={!isError && data?.onboardingRequired ? '/onboarding' : '/home'} />;
}

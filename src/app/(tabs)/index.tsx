import { Redirect } from 'expo-router';

import { getAccessToken } from '@/lib/api';

// 앱 진입점 — 저장된 세션이 있으면 홈으로, 없으면 로그인으로.
// _layout 모듈 로드 시 hydrateTokens()가 SecureStore→인메모리 복원을 이미 끝내므로
// 이 시점 getAccessToken()은 지난 로그인 토큰을 반영한다(있으면 자동 로그인). accessToken이
// 만료됐어도 홈의 첫 인증 요청이 401→재발급으로 이어지고, 재발급까지 실패하면 client.ts가
// onAuthExpired로 /login으로 돌려보낸다.
export default function Index() {
  return <Redirect href={getAccessToken() ? '/home' : '/login'} />;
}

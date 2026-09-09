// 소셜 Provider 인증 → authToken 획득. 이 authToken을 백엔드 POST /auth/social-login 에 넘긴다.
//
// ⚠️ 각 Provider는 전용 SDK/설정이 필요하다(아직 미연동, 모두 네이티브 모듈 → 설치 후 dev client 재빌드):
//   - Apple : expo-apple-authentication (이번에 .p8 키 발급 완료) → credential.identityToken
//   - Kakao : @react-native-seoul/kakao-login 등 + 네이티브 앱 키
//   - Naver : @react-native-seoul/naver-login 등 + client id/secret
//   - Google: expo-auth-session 또는 @react-native-google-signin
// 연동되면 아래 getSocialAuthToken의 각 분기를 구현하면 된다.

export type SocialProvider = 'kakao' | 'naver' | 'google' | 'apple';

// 백엔드 provider 문자열. KAKAO·NAVER는 백엔드 확인됨, APPLE·GOOGLE은 백엔드 값 확인 필요.
export const API_PROVIDER: Record<SocialProvider, string> = {
  kakao: 'KAKAO',
  naver: 'NAVER',
  google: 'GOOGLE',
  apple: 'APPLE',
};

/** 소셜 SDK가 아직 연동되지 않았음을 알리는 에러 (호출부에서 구분해 처리). */
export class SocialAuthNotConfiguredError extends Error {
  constructor(readonly provider: SocialProvider) {
    super(`${provider} 소셜 로그인 SDK가 아직 연동되지 않았습니다.`);
    this.name = 'SocialAuthNotConfiguredError';
  }
}

/**
 * Provider SDK로 로그인해 백엔드에 넘길 authToken을 반환한다.
 *
 * ⚠️ 카카오/네이버 네이티브 SDK(@react-native-seoul/*)는 Expo 57의 precompiled React와
 * 충돌한다(Naver vendored 동적 프레임워크가 React.framework 임베드를 깨뜨려 앱이 dyld
 * 크래시). 로컬 네이티브 연동 보류. 대안: expo-auth-session 웹 OAuth(구글처럼) 또는 EAS Build.
 * 백엔드는 provider accessToken만 있으면 검증 가능(kakao/naver userinfo API 호출).
 */
export async function getSocialAuthToken(provider: SocialProvider): Promise<string> {
  throw new SocialAuthNotConfiguredError(provider);
}

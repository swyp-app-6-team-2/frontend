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
 * 현재는 미연동이라 SocialAuthNotConfiguredError를 던진다.
 */
export async function getSocialAuthToken(provider: SocialProvider): Promise<string> {
  // TODO(provider별 연동). 예) Apple:
  //   import * as AppleAuthentication from 'expo-apple-authentication';
  //   const cred = await AppleAuthentication.signInAsync({
  //     requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
  //   });
  //   if (!cred.identityToken) throw new Error('Apple identityToken 없음');
  //   return cred.identityToken;
  throw new SocialAuthNotConfiguredError(provider);
}

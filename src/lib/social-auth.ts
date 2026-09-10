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

// 리빌드 전 dev client엔 네이티브 모듈이 없어 import/호출이 이 형태로 실패한다.
function isNativeModuleMissing(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /native module|requireNativeModule|RNKakao|RNNaver|TurboModule|Cannot find/i.test(msg);
}

// 카카오 네이티브 SDK — 카카오톡 app-to-app 로그인. accessToken 반환.
async function getKakaoAccessToken(): Promise<string> {
  const { login } = await import('@react-native-seoul/kakao-login');
  const token = await login();
  return token.accessToken;
}

// 네이버 네이티브 SDK — initialize 후 login. successResponse.accessToken 반환.
async function getNaverAccessToken(): Promise<string> {
  const NaverLogin = (await import('@react-native-seoul/naver-login')).default;
  NaverLogin.initialize({
    appName: '별따먹자',
    consumerKey: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
    consumerSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '',
    serviceUrlSchemeIOS: 'naverlogin',
    // false = 네이버 앱 설치 시 app-to-app. Info.plist LSApplicationQueriesSchemes 필요.
    disableNaverAppAuthIOS: false,
  });
  const res = await NaverLogin.login();
  if (!res.isSuccess || !res.successResponse?.accessToken) {
    throw new Error('네이버 로그인에 실패했어요.');
  }
  return res.successResponse.accessToken;
}

/**
 * Provider별 네이티브 SDK 로그인 → 백엔드에 넘길 accessToken 반환.
 * 백엔드는 이 accessToken으로 kakao/naver userinfo API를 호출해 검증한다.
 * 네이티브 모듈이라 사용 시점에 동적 import — 리빌드 전엔 SocialAuthNotConfiguredError로 폴백.
 */
export async function getSocialAuthToken(provider: SocialProvider): Promise<string> {
  try {
    if (provider === 'kakao') return await getKakaoAccessToken();
    if (provider === 'naver') return await getNaverAccessToken();
  } catch (e) {
    if (isNativeModuleMissing(e)) throw new SocialAuthNotConfiguredError(provider);
    throw e;
  }
  // 애플은 아직 스텁.
  throw new SocialAuthNotConfiguredError(provider);
}

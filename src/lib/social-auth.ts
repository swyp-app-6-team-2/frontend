// 소셜 Provider 인증 → authToken 획득. 이 authToken을 백엔드 POST /auth/social-login 에 넘긴다.
//
// Provider별 전용 네이티브 SDK 사용(설치 후 dev client 재빌드 필요):
//   - Apple : expo-apple-authentication → credential.identityToken (+ nonce)
//   - Kakao : @react-native-seoul/kakao-login → accessToken
//   - Naver : @react-native-seoul/naver-login → accessToken
//   - Google: @react-native-google-signin/google-signin → idToken

export type SocialProvider = 'kakao' | 'naver' | 'google' | 'apple';

// 백엔드에 넘길 결과. nonce는 애플만 채운다(identityToken의 nonce 클레임과 원문 비교).
export type SocialAuthResult = { authToken: string; nonce?: string };

// 소셜 SDK 초기화 설정 — 프리워밍과 로그인 시점에서 공유(값 드리프트 방지).
const GOOGLE_CONFIG = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  // webClientId를 주면 idToken aud가 웹 client id로 찍혀 백엔드 검증과 맞는다.
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};
const NAVER_CONFIG = {
  appName: '별따먹자',
  consumerKey: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
  consumerSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '',
  serviceUrlSchemeIOS: 'starpicknaver',
  disableNaverAppAuthIOS: false, // 네이버 앱 설치 시 app-to-app
};

/**
 * 앱 시작 시 1회 호출 — 소셜 SDK를 미리 로드·초기화해 "첫 탭 깜빡"을 없앤다.
 * 네이티브 모듈이 없거나(리빌드 전) 실패해도 조용히 무시한다. 로그인은 탭 시점에 다시
 * configure/initialize를 호출하므로(멱등) 프리워밍이 실패해도 안전하다.
 */
export async function prewarmSocialAuth(): Promise<void> {
  try {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure(GOOGLE_CONFIG);
  } catch {
    // 네이티브 모듈 없음/실패 — 무시(탭 시점에 재설정).
  }
  try {
    const NaverLogin = (await import('@react-native-seoul/naver-login')).default;
    NaverLogin.initialize(NAVER_CONFIG);
  } catch {
    // 무시.
  }
}

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

/** 사용자가 로그인 시트를 취소함 (호출부에서 조용히 무시). */
export class SocialAuthCanceledError extends Error {
  constructor(readonly provider: SocialProvider) {
    super(`${provider} 로그인이 취소되었습니다.`);
    this.name = 'SocialAuthCanceledError';
  }
}

// 리빌드 전 dev client엔 네이티브 모듈이 없어 import/호출이 이 형태로 실패한다.
function isNativeModuleMissing(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /native module|requireNativeModule|RNKakao|RNNaver|TurboModule|Cannot find/i.test(msg);
}

// 사용자가 로그인 창을 닫음(애플 ERR_REQUEST_CANCELED 등).
function isUserCancel(e: unknown): boolean {
  const code = (e as { code?: string } | null)?.code;
  const msg = e instanceof Error ? e.message : String(e);
  return code === 'ERR_REQUEST_CANCELED' || /cancel/i.test(msg);
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
  NaverLogin.initialize(NAVER_CONFIG); // 프리워밍과 동일 설정(멱등)
  const res = await NaverLogin.login();
  if (res.failureResponse?.isCancel) throw new SocialAuthCanceledError('naver');
  if (!res.isSuccess || !res.successResponse?.accessToken) {
    throw new Error('네이버 로그인에 실패했어요.');
  }
  return res.successResponse.accessToken;
}

// 구글 네이티브 Sign-In — 네이티브 계정 선택 시트. idToken 반환(백엔드로).
// webClientId를 주면 idToken의 aud가 웹 클라이언트 ID로 찍혀 백엔드 검증과 맞는다.
async function getGoogleIdToken(): Promise<string> {
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure(GOOGLE_CONFIG); // 프리워밍과 동일 설정(멱등)
  const res = await GoogleSignin.signIn();
  if (res.type === 'cancelled') throw new SocialAuthCanceledError('google');
  if (res.type !== 'success' || !res.data.idToken) {
    throw new Error('구글 로그인에 실패했어요.');
  }
  return res.data.idToken;
}

// 애플 Sign In — identityToken(RS256 JWT, aud=번들ID) + nonce.
// nonce를 그대로 signInAsync에 넘기면 identityToken의 nonce 클레임에 원문 echo되고,
// 백엔드도 원문 비교라 해싱하지 않는다(리플레이 방지용 랜덤값이면 충분).
async function getAppleAuth(): Promise<SocialAuthResult> {
  const AppleAuthentication = await import('expo-apple-authentication');
  const Crypto = await import('expo-crypto');
  const nonce = Crypto.randomUUID();
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce,
  });
  if (!credential.identityToken) {
    throw new Error('애플 로그인에 실패했어요.');
  }
  return { authToken: credential.identityToken, nonce };
}

/**
 * Provider별 네이티브 SDK 로그인 → 백엔드에 넘길 { authToken, nonce? } 반환.
 * google=idToken, kakao/naver=accessToken, apple=identityToken(+nonce). 백엔드가 provider별로 검증한다.
 * 네이티브 모듈이라 사용 시점에 동적 import — 리빌드 전엔 SocialAuthNotConfiguredError로 폴백.
 */
export async function getSocialAuthToken(provider: SocialProvider): Promise<SocialAuthResult> {
  try {
    if (provider === 'google') return { authToken: await getGoogleIdToken() };
    if (provider === 'kakao') return { authToken: await getKakaoAccessToken() };
    if (provider === 'naver') return { authToken: await getNaverAccessToken() };
    return await getAppleAuth();
  } catch (e) {
    if (isNativeModuleMissing(e)) throw new SocialAuthNotConfiguredError(provider);
    if (isUserCancel(e)) throw new SocialAuthCanceledError(provider);
    throw e;
  }
}

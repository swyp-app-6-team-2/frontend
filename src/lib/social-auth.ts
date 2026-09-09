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

// 카카오 OAuth 2.0 엔드포인트 (REST). 네이티브 SDK 대신 브라우저 인증(expo-auth-session).
const KAKAO_DISCOVERY = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
  tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

// 카카오 웹 OAuth: authorize(브라우저) → code → token 교환 → accessToken.
// 백엔드는 이 accessToken으로 kapi.kakao.com/v2/user/me 호출해 검증한다.
async function getKakaoAccessToken(): Promise<string> {
  const restKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
  // REST API 키 없으면 미연동으로 처리(dev 폴백). 네이티브 앱 키와 다른 값이다.
  if (!restKey) throw new SocialAuthNotConfiguredError('kakao');

  const AuthSession = await import('expo-auth-session');
  const WebBrowser = await import('expo-web-browser');
  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'orca', path: 'oauth' });
  const request = new AuthSession.AuthRequest({
    clientId: restKey,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: [],
    usePKCE: false,
  });
  await request.makeAuthUrlAsync(KAKAO_DISCOVERY);

  const result = await request.promptAsync(KAKAO_DISCOVERY);
  if (result.type !== 'success' || !result.params.code) {
    throw new Error('카카오 로그인이 취소되었거나 실패했어요.');
  }

  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId: restKey,
      code: result.params.code,
      redirectUri,
      extraParams: {
        grant_type: 'authorization_code',
        // 카카오 콘솔에서 Client Secret을 켠 경우에만 필요.
        ...(process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET
          ? { client_secret: process.env.EXPO_PUBLIC_KAKAO_CLIENT_SECRET }
          : {}),
      },
    },
    KAKAO_DISCOVERY,
  );
  if (!token.accessToken) throw new Error('카카오 토큰 교환에 실패했어요.');
  return token.accessToken;
}

/**
 * Provider별 로그인 → 백엔드에 넘길 authToken(accessToken) 반환.
 * 카카오: expo-auth-session 웹 OAuth로 연동. 네이버/애플: 아직 미연동(스텁).
 */
export async function getSocialAuthToken(provider: SocialProvider): Promise<string> {
  if (provider === 'kakao') return getKakaoAccessToken();
  // 네이버(웹 OAuth 예정)·애플은 아직.
  throw new SocialAuthNotConfiguredError(provider);
}

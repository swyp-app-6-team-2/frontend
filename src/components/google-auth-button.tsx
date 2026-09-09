import { useEffect } from 'react';
import { Pressable } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';

import type { GoogleLoginSlotProps } from './google-login-slot';

// 소셜 로그인 후 웹 브라우저 세션 정리(리다이렉트 복귀 처리).
WebBrowser.maybeCompleteAuthSession();

// expo-auth-session(→ 네이티브 ExpoApplication)에 의존하는 실제 구글 버튼.
// 이 모듈은 google-login-slot에서 lazy로만 불러 native 모듈이 없을 때 격리된다.
export default function GoogleAuthButton({
  src,
  label,
  disabled,
  onIdToken,
  onError,
}: GoogleLoginSlotProps) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // 구글 인증 결과 처리 — idToken을 상위로 넘긴다(백엔드 로그인은 login 화면이 담당).
  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken ?? response.params?.id_token;
    if (!idToken) {
      onError('구글 인증 토큰을 받지 못했어요.');
      return;
    }
    onIdToken(idToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <Pressable
      onPress={() => void promptAsync()}
      disabled={disabled || !request}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="active:opacity-80"
    >
      <Image source={src} style={{ width: 56, height: 56 }} contentFit="contain" />
    </Pressable>
  );
}

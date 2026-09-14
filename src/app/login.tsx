import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui';
import { useSocialLogin } from '@/hooks/use-api';
import { ApiError } from '@/lib/api';
import {
  API_PROVIDER,
  getSocialAuthToken,
  SocialAuthCanceledError,
  SocialAuthNotConfiguredError,
  type SocialProvider,
} from '@/lib/social-auth';

const PROVIDERS = [
  { key: 'kakao' as SocialProvider, src: require('../assets/images/kakao.png'), name: '카카오' },
  { key: 'naver' as SocialProvider, src: require('../assets/images/naver.png'), name: '네이버' },
  { key: 'google' as SocialProvider, src: require('../assets/images/google.png'), name: '구글' },
  { key: 'apple' as SocialProvider, src: require('../assets/images/apple.png'), name: '애플' },
];

// Figma 402×874 절대 좌표를 화면 높이 비율로. (같은 비율로 모든 기기 대응)
const H = 874;
const rowStyle = (top: number) =>
  ({
    position: 'absolute',
    top: `${(top / H) * 100}%`,
    left: 0,
    right: 0,
    alignItems: 'center',
  }) as const;

export default function LoginScreen() {
  const router = useRouter();
  const socialLogin = useSocialLogin();

  // 백엔드 로그인 + 신규/기존 분기.
  const finishLogin = async (provider: string, authToken: string, nonce?: string) => {
    try {
      const res = await socialLogin.mutateAsync({ provider, authToken, nonce });
      if (res.requiresTermsAgreement) {
        // 신규 → 약관. signupToken을 넘겨 약관 화면이 가입 완료(POST /auth/signup)에 사용.
        router.push({ pathname: '/terms', params: { signupToken: res.signupToken ?? '' } });
      } else {
        router.replace('/home'); // 기존 → 홈 (accessToken은 훅이 저장)
      }
    } catch (e) {
      Alert.alert('로그인 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
    }
  };

  const onProvider = async (provider: SocialProvider) => {
    // 카카오/네이버/구글/애플 — 각 네이티브 SDK 로그인. 리빌드 전엔 미연동 폴백.
    try {
      const { authToken, nonce } = await getSocialAuthToken(provider);
      await finishLogin(API_PROVIDER[provider], authToken, nonce);
    } catch (e) {
      if (e instanceof SocialAuthCanceledError) return; // 사용자가 닫음 — 조용히 무시
      if (e instanceof SocialAuthNotConfiguredError) {
        if (__DEV__) router.replace('/onboarding');
        return;
      }
      Alert.alert('로그인 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* 밤하늘 배경 (풀스크린) */}
      <Image
        source={require('../assets/images/login-bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* 타이틀 '별따먹자' + 부제 (Group 171 이미지) — top 182 */}
      <View style={rowStyle(182)}>
        <Image
          source={require('../assets/images/login-title.png')}
          style={{ width: 362, height: 113 }}
          contentFit="contain"
        />
      </View>

      {/* 마스코트 (Group 173) — top 433 */}
      <View style={rowStyle(433)}>
        <Image
          source={require('../assets/images/login-mascot.png')}
          style={{ width: 237, height: 179 }}
          contentFit="contain"
        />
      </View>

      {/* SNS 간편 가입 문구 — top 648 */}
      <View style={rowStyle(648)}>
        <AppText variant="body" className="text-center font-normal leading-[21px] text-muted">
          SNS 계정으로 간편 가입하기
        </AppText>
      </View>

      {/* SNS 버튼 (56×56, gap 16) — top 689 */}
      <View style={rowStyle(689)}>
        <View className="flex-row gap-4">
          {PROVIDERS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => onProvider(p.key)}
              disabled={socialLogin.isPending}
              accessibilityRole="button"
              accessibilityLabel={`${p.name}로 계속하기`}
              className="active:opacity-80"
            >
              <Image source={p.src} style={{ width: 56, height: 56 }} contentFit="contain" />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

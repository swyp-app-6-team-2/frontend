import { Alert, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { GoogleLoginSlot } from '@/components/google-login-slot';
import { AppText } from '@/components/ui';
import { useSocialLogin } from '@/hooks/use-api';
import { ApiError } from '@/lib/api';
import {
  API_PROVIDER,
  getSocialAuthToken,
  SocialAuthNotConfiguredError,
  type SocialProvider,
} from '@/lib/social-auth';

const PROVIDERS = [
  { key: 'kakao' as SocialProvider, src: require('../assets/images/kakao.png'), name: '카카오' },
  { key: 'naver' as SocialProvider, src: require('../assets/images/naver.png'), name: '네이버' },
  { key: 'google' as SocialProvider, src: require('../assets/images/google.png'), name: '구글' },
  { key: 'apple' as SocialProvider, src: require('../assets/images/apple.png'), name: '애플' },
];

export default function LoginScreen() {
  const router = useRouter();
  const socialLogin = useSocialLogin();

  // 백엔드 로그인 + 신규/기존 분기.
  const finishLogin = async (provider: string, authToken: string) => {
    try {
      const res = await socialLogin.mutateAsync({ provider, authToken });
      if (res.requiresTermsAgreement) {
        router.push('/terms'); // 신규 → 약관 (signupToken은 응답에)
      } else {
        router.replace('/home'); // 기존 → 홈 (accessToken은 훅이 저장)
      }
    } catch (e) {
      Alert.alert('로그인 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
    }
  };

  const onProvider = async (provider: SocialProvider) => {
    // 카카오/네이버/애플 — SDK 미연동(스텁). dev에선 온보딩 폴백.
    // (구글은 GoogleLoginSlot이 직접 처리)
    try {
      const authToken = await getSocialAuthToken(provider);
      await finishLogin(API_PROVIDER[provider], authToken);
    } catch (e) {
      if (e instanceof SocialAuthNotConfiguredError) {
        if (__DEV__) router.replace('/onboarding');
        return;
      }
      Alert.alert('로그인 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-5 px-screen">
        {/* 히어로: 마스코트 + 앱 이름 (추후 인트로 gif/영상으로 교체) */}
        <Image
          source={require('../assets/images/character.png')}
          style={{ width: 132, height: 124 }}
          contentFit="contain"
        />
        <AppText variant="title" className="text-[32px] leading-[40px] text-foreground">
          별따먹자
        </AppText>
      </View>

      {/* SNS 간편 가입 (Figma 402×874) — 문구 top 611 / 버튼 top 652·bottom 708 → 하단 166px */}
      <View className="items-center gap-5 px-screen pb-[166px]">
        <AppText variant="body" className="text-center font-normal leading-[21px] text-muted">
          SNS 계정으로 간편 가입하기
        </AppText>
        <View className="flex-row gap-4">
          {PROVIDERS.map((p) =>
            p.key === 'google' ? (
              <GoogleLoginSlot
                key={p.key}
                src={p.src}
                label={`${p.name}로 계속하기`}
                disabled={socialLogin.isPending}
                onIdToken={(idToken) => void finishLogin(API_PROVIDER.google, idToken)}
                onError={(msg) => Alert.alert('로그인 실패', msg)}
              />
            ) : (
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
            ),
          )}
        </View>
      </View>
    </View>
  );
}

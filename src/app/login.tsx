import { Alert, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

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

  // 소셜 SDK로 authToken 획득 → 백엔드 로그인 → 신규는 약관, 기존은 홈.
  const onProvider = async (provider: SocialProvider) => {
    try {
      const authToken = await getSocialAuthToken(provider);
      const res = await socialLogin.mutateAsync({ provider: API_PROVIDER[provider], authToken });
      if (res.requiresTermsAgreement) {
        router.push('/terms'); // 신규 회원 → 약관 동의 (signupToken은 서버 응답에 있음)
      } else {
        router.replace('/home'); // 기존 회원 → 홈 (accessToken은 훅이 저장)
      }
    } catch (e) {
      if (e instanceof SocialAuthNotConfiguredError) {
        // 소셜 SDK 미연동 — 개발 중엔 기존 목업 흐름(온보딩) 유지
        if (__DEV__) router.replace('/onboarding');
        return;
      }
      const message =
        e instanceof ApiError ? e.message : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
      Alert.alert('로그인 실패', message);
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

import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText } from '@/components/ui';

const PROVIDERS = [
  { key: 'kakao', src: require('../assets/images/kakao.png'), name: '카카오' },
  { key: 'naver', src: require('../assets/images/naver.png'), name: '네이버' },
  { key: 'google', src: require('../assets/images/google.png'), name: '구글' },
  { key: 'apple', src: require('../assets/images/apple.png'), name: '애플' },
];

export default function LoginScreen() {
  const router = useRouter();
  // 로그인 성공 → 온보딩 → 홈
  const login = () => router.replace('/onboarding');

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-5 px-screen">
        {/* 히어로: 마스코트 + 로고 워드마크 (추후 인트로 gif/영상으로 교체) */}
        <Image
          source={require('../assets/images/character.png')}
          style={{ width: 132, height: 124 }}
          contentFit="contain"
        />
        <Image
          source={require('../assets/images/logo.png')}
          style={{ width: 176, height: 50 }}
          contentFit="contain"
        />
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
              onPress={login}
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

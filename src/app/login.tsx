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
      <View className="flex-1 items-center justify-center px-screen">
        {/* 히어로 미디어 자리 */}
        <View className="h-60 w-full max-w-[300px] items-center justify-center rounded-card border border-dashed border-foreground/15">
          <AppText variant="chip" className="text-muted">
            (gif or img)
          </AppText>
        </View>
      </View>

      {/* SNS 간편 가입 — 문구↔버튼 20px, 클러스터↔하단 140px */}
      <View className="items-center gap-5 px-screen pb-[140px]">
        <AppText variant="body" className="text-muted">
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

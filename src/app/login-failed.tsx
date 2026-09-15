import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';

// 소셜 로그인 실패 화면. provider(kakao|naver|google|apple)에 따라 본문 문구만 바뀐다.
const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: '구글',
  apple: '애플',
};

export default function LoginFailedScreen() {
  const router = useRouter();
  const { provider } = useLocalSearchParams<{ provider?: string }>();
  const name = PROVIDER_LABEL[provider ?? ''] ?? '소셜';

  return (
    <Screen>
      {/* 마스코트 + 문구 (중앙) */}
      <View className="flex-1 items-center justify-center">
        <View className="items-center gap-[34px]">
          <Image
            source={require('../assets/images/login-failed-mascot.png')}
            style={{ width: 125, height: 121 }}
            contentFit="contain"
          />
          <View className="items-center gap-3">
            <AppText variant="subheading" className="text-center">
              로그인에 실패했어요
            </AppText>
            <AppText variant="body" className="text-center" style={{ color: palette.bodyMuted }}>
              {`${name} 인증 중 문제가 발생했어요\n잠시 후 다시 시도해주세요`}
            </AppText>
          </View>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View className="pb-2 pt-4">
        <Button label="다시 시도" onPress={() => router.back()} />
        <Pressable
          onPress={() => router.replace('/login')}
          accessibilityRole="button"
          accessibilityLabel="다른 방법으로 로그인"
          className="items-center py-3 active:opacity-70"
        >
          <Text className="text-chip font-medium text-body-muted">다른 방법으로 로그인 할게요</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

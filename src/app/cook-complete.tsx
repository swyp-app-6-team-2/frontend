import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

// [stub] 22 요리 완료 기록 — 별에 불이 켜지는 게이미피케이션(앱 정체성).
export default function CookCompleteScreen() {
  const router = useRouter();
  return (
    <Screen scroll>
      <View className="items-center gap-4 py-12">
        <Text className="text-[72px]">⭐</Text>
        <AppText variant="title" className="text-center text-primary">
          별에 불이 켜졌어요!
        </AppText>
        <AppText variant="body" className="text-center">
          누구나 성공하는 초간단 목살김치찜
        </AppText>
        <AppText variant="body" className="text-center text-muted">
          방금 요리 완료 · 지금까지 총 4회 완료했어요
        </AppText>
      </View>
      <Button label="홈으로 가기" onPress={() => router.dismissAll()} />
    </Screen>
  );
}

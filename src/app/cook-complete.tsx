import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

// 22 요리 완료 기록 — 별에 불이 켜지는 게이미피케이션(앱 정체성).
// 요리 완료 기록 생성은 상세 화면에서 처리되고, 여기선 축하만 보여준다.
export default function CookCompleteScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title: string }>();
  return (
    <Screen scroll>
      <View className="items-center gap-4 py-12">
        <Text className="text-[72px]">⭐</Text>
        <AppText variant="title" className="text-center text-primary">
          별에 불이 켜졌어요!
        </AppText>
        {title ? (
          <AppText variant="body" className="text-center">
            {title}
          </AppText>
        ) : null}
        <AppText variant="body" className="text-center text-muted">
          방금 요리 완료 기록이 저장됐어요
        </AppText>
      </View>
      <Button label="홈으로 가기" onPress={() => router.dismissAll()} />
    </Screen>
  );
}

import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

// [stub] 홈 — 추천/최근 레시피, 별 진행도(게이미피케이션) 요약.
export default function HomeScreen() {
  const router = useRouter();
  return (
    <Screen title="홈" scroll>
      <AppText variant="body" className="text-muted">
        ⭐ 별 진행도 · 추천 레시피 · 임박 재료 요약이 들어갈 자리
      </AppText>
      <View className="gap-3">
        <Button label="나의 레시피" variant="secondary" onPress={() => router.push('/recipes')} />
        <Button label="내 냉장고" variant="secondary" onPress={() => router.push('/fridge')} />
        <Button label="+ 레시피 등록" onPress={() => router.push('/add-recipe')} />
      </View>
    </Screen>
  );
}

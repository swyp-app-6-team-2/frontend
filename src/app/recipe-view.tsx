import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SectionTitle, Tag } from '@/components/ui';

// [stub] 21 레시피 상세 — 저장된 레시피 보기 + "해먹었어요"로 완료 기록.
export default function RecipeViewScreen() {
  const router = useRouter();
  return (
    <Screen title="레시피 상세" back scroll>
      <AppText variant="title">누구나 성공하는 초간단 목살김치찜</AppText>
      <AppText variant="body" className="text-muted">
        50분 · 1인분 · ▶ 유튜브에서 저장됨
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        <Tag label="한식" active />
        <Tag label="김치" />
      </View>
      <View className="gap-2">
        <SectionTitle>재료</SectionTitle>
        <AppText variant="body" className="text-muted">
          양파 1개 · 대파 2대 · 김치 반 포기
        </AppText>
      </View>
      <View className="gap-2">
        <SectionTitle>조리 순서</SectionTitle>
        <AppText variant="body" className="text-muted">
          단계별 조리 순서가 들어갈 자리
        </AppText>
      </View>
      <Button label="🍳 해먹었어요" onPress={() => router.push('/cook-complete')} />
    </Screen>
  );
}

import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar, SectionTitle } from '@/components/ui';

// [stub] 18 레시피 직접 입력 — 이름/카테고리/시간/재료/조리순서 폼.
export default function AddRecipeManualScreen() {
  const router = useRouter();
  return (
    <Screen title="레시피 직접 입력" back scroll>
      <SectionTitle>이름*</SectionTitle>
      <SearchBar placeholder="레시피명" leftIcon={null} />
      <View className="gap-2">
        <SectionTitle>재료</SectionTitle>
        <AppText variant="body" className="text-muted">
          재료 · 수량 입력 행 + [＋재료 추가]가 들어갈 자리
        </AppText>
      </View>
      <View className="gap-2">
        <SectionTitle>조리 순서</SectionTitle>
        <AppText variant="body" className="text-muted">
          단계별 조리 순서 입력이 들어갈 자리
        </AppText>
      </View>
      <Button label="다음" onPress={() => router.push('/recipe-detail')} />
    </Screen>
  );
}

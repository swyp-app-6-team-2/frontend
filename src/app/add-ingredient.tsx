import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Chip, Screen, SearchBar } from '@/components/ui';

// [stub] 13 재료 추가하기 — 검색 + 카테고리 필터 + 담기.
const CATS = ['전체', '채소', '양념', '육류', '기타'];

export default function AddIngredientScreen() {
  const router = useRouter();
  return (
    <Screen title="재료 추가하기" back scroll>
      <SearchBar placeholder="재료명을 검색해보세요" />
      <View className="flex-row flex-wrap gap-2">
        {CATS.map((c, i) => (
          <Chip key={c} label={c} active={i === 0} />
        ))}
      </View>
      <AppText variant="body" className="text-muted">
        재료 목록(가지·감자·계란·두부 …)이 들어갈 자리
      </AppText>
      <Button label="선택한 재료 담기 (1)" onPress={() => router.back()} />
    </Screen>
  );
}

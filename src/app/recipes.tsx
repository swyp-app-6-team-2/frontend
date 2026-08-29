import { useRouter } from 'expo-router';

import { AppText, Button, ListRow, Screen, SearchBar } from '@/components/ui';

// [stub] 나의 레시피 — 목록/검색/필터, +버튼으로 등록 플로우 진입.
const RECIPES = ['들기름 막국수', '연어 포케', '방울토마토 파스타', '마파두부', '김치볶음밥'];

export default function RecipesScreen() {
  const router = useRouter();
  return (
    <Screen title="나의 레시피" scroll>
      <SearchBar placeholder="요리명, 재료 검색" />
      <AppText variant="chip" className="text-muted">
        카테고리 ▾ · 재료 ▾ · 최신순 ▾ (필터 자리)
      </AppText>
      {RECIPES.map((label) => (
        <ListRow key={label} label={label} onPress={() => router.push('/recipe-view')} />
      ))}
      <Button label="+ 레시피 등록" onPress={() => router.push('/add-recipe')} />
    </Screen>
  );
}

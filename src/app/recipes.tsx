import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from '@/components/tab-bar';
import { AppText, SearchBar } from '@/components/ui';

type Category = '한식' | '양식' | '중식';
type Recipe = { title: string; category: Category };

// 나의레시피_main — 목업 데이터 (실제 이미지 자산 없음 → field 플레이스홀더).
const RECIPES: Recipe[] = [
  { title: '들기름 막국수', category: '한식' },
  { title: '애호박 새우젓 볶음', category: '한식' },
  { title: '연어 포케', category: '양식' },
  { title: '마파두부', category: '중식' },
  { title: '방울토마토 파스타', category: '양식' },
  { title: '김치볶음밥', category: '한식' },
];

const FILTERS = ['카테고리', '재료', '최신순'];

// FAB 팝오버 메뉴 — URL / 이미지 / 직접 등록.
const ADD_MENU: { icon: string; label: string; href: Href }[] = [
  { icon: '🔗', label: 'URL로 등록', href: '/add-recipe-url' },
  { icon: '🖼️', label: '이미지로 등록', href: '/add-recipe-image' },
  { icon: '✏️', label: '직접 등록', href: '/add-recipe-manual' },
];

// Figma 필터칩 — h36, pill, 투명 bg + 1px border #1E2230(field), gap4, px16.
// 라벨 14px 흰색 + 우측 16px 드롭다운 아이콘. 화살표는 다크 배경에서 보이도록
// muted (Figma 익스포트의 #18181B는 배경과 겹쳐 안 보임).
function FilterChip({ label }: { label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      className="h-9 flex-row items-center justify-center gap-1 rounded-pill border border-field px-4 active:opacity-80"
    >
      <Text className="text-chip text-foreground">{label}</Text>
      <View className="h-4 w-4 items-center justify-center">
        <Text className="text-[11px] leading-none text-muted">▾</Text>
      </View>
    </Pressable>
  );
}

// Figma 카드 — 이미지 173×127(aspect 173/127), radius 12. 좌상단 4px 인셋에
// 미니칩(field bg, pill, px12 py4, 12px bold). 제목은 이미지 아래 12px, 16px bold.
function RecipeCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  return (
    <Pressable className="w-[48%] active:opacity-90" onPress={onPress} accessibilityRole="button">
      <View className="aspect-[173/127] w-full overflow-hidden rounded-[12px] bg-field">
        <View className="absolute left-1 top-1 rounded-pill bg-field px-3 py-1">
          <Text className="text-[12px] font-bold text-foreground">{recipe.category}</Text>
        </View>
      </View>
      <AppText variant="body" className="mt-3 font-bold" numberOfLines={1}>
        {recipe.title}
      </AppText>
    </Pressable>
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerClassName="gap-4 px-screen pb-[120px] pt-2"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="title">나의 레시피</AppText>
          <SearchBar placeholder="레시피명을 검색해보세요" />
          <View className="flex-row gap-2">
            {FILTERS.map((f) => (
              <FilterChip key={f} label={f} />
            ))}
          </View>
          {/* 2열 그리드 — 열 간격 16(justify-between), 행 간격 24(Figma 역산) */}
          <View className="flex-row flex-wrap justify-between gap-y-6">
            {RECIPES.map((r) => (
              <RecipeCard key={r.title} recipe={r} onPress={() => router.push('/recipe-view')} />
            ))}
          </View>
        </ScrollView>

        <TabBar active="recipes" />
      </SafeAreaView>

      {/* 팝오버 열림 시 바깥 탭하면 닫힘 */}
      {menuOpen ? (
        <Pressable
          className="absolute inset-0"
          onPress={() => setMenuOpen(false)}
          accessibilityLabel="메뉴 닫기"
        />
      ) : null}

      {/* 플로팅 + 버튼 + 등록 메뉴 */}
      <View className="absolute bottom-[96px] right-5 items-end" pointerEvents="box-none">
        {menuOpen ? (
          <View className="mb-3 w-52 rounded-card border border-foreground/10 bg-surface p-2">
            {ADD_MENU.map((m) => (
              <Pressable
                key={m.label}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(m.href);
                }}
                className="flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-field"
                accessibilityRole="button"
              >
                <Text className="text-[20px]">{m.icon}</Text>
                <Text className="text-body text-foreground">{m.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Pressable
          onPress={() => setMenuOpen((o) => !o)}
          className="h-14 w-14 items-center justify-center rounded-full bg-primary active:opacity-90"
          accessibilityRole="button"
          accessibilityLabel="레시피 등록"
        >
          <Text className="text-[30px] leading-none text-ink">{menuOpen ? '×' : '＋'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

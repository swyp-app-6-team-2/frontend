import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddRecipeMenu } from '@/components/add-recipe-menu';
import { RecipeFilterSheet, RecipeSortSheet } from '@/components/recipe-filter-sheet';
import { TabBar } from '@/components/tab-bar';
import { AppText, PressableScale, SearchBar } from '@/components/ui';
import { staggerDelay } from '@/constants/animation';
import { RECIPE_CATEGORY_LABEL } from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useMyIngredients, useRecipes } from '@/hooks/use-api';
import { useEnteringOnce } from '@/hooks/use-entering-once';
import type { RecipeCategory, RecipeListItem, RecipeListSort } from '@/lib/api/types';

// 저장 슬롯 최대 50개 — 초과 시 slot-full 팝업
const MAX_SLOTS = 50;

// Figma 필터칩 — h36, pill, 투명 bg + 1px border #1E2230(field), gap4, px16.
// 라벨 14px 흰색 + 우측 16px 드롭다운 아이콘. 화살표는 다크 배경에서 보이도록
// muted (Figma 익스포트의 #18181B는 배경과 겹쳐 안 보임).
function FilterChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      haptic="selection"
      className="h-9 flex-row items-center justify-center gap-1 rounded-pill border border-field px-4"
    >
      <Text className="text-chip text-foreground">{label}</Text>
      <Image
        source={require('../assets/images/ic-chevron-down.png')}
        style={{ width: 20, height: 20 }}
        tintColor={palette.muted}
        contentFit="contain"
      />
    </PressableScale>
  );
}

// 적용된 필터 태그 — 골드 라벨 + × (탭하면 해당 필터 제거). Figma: #FFD457 + close 16.
function ActiveFilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`${label} 필터 제거`}
      className="flex-row items-center gap-1 active:opacity-70"
    >
      <Text className="text-[14px] leading-[17px] text-primary">{label}</Text>
      <Feather name="x" size={16} color={palette.muted} />
    </Pressable>
  );
}

// Figma 카드 — 이미지 173×127(aspect 173/127), radius 12. 좌상단 4px 인셋에
// 미니칩(field bg, pill, px12 py4, 12px bold). 제목은 이미지 아래 12px, 16px bold.
function RecipeCard({ item, onPress }: { item: RecipeListItem; onPress: () => void }) {
  return (
    <Pressable className="w-full active:opacity-90" onPress={onPress} accessibilityRole="button">
      <View className="aspect-[173/127] w-full overflow-hidden rounded-[12px] bg-field">
        <Image
          source={
            item.coverImageUrl
              ? { uri: item.coverImageUrl }
              : require('../assets/images/food-sample.png')
          }
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <View className="absolute left-1 top-1 rounded-pill bg-field px-3 py-1">
          <Text className="text-[12px] font-bold text-foreground">
            {RECIPE_CATEGORY_LABEL[item.categoryCode]}
          </Text>
        </View>
      </View>
      <AppText variant="body" className="mt-3 font-bold" numberOfLines={1}>
        {item.title}
      </AppText>
    </Pressable>
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  // 필터: 정렬·카테고리·재료 + 시트 열림
  const [sort, setSort] = useState<RecipeListSort>('LATEST');
  const [selectedCats, setSelectedCats] = useState<Set<RecipeCategory>>(new Set());
  const [selectedIngs, setSelectedIngs] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);

  const { data, isLoading, isError } = useRecipes({ sort });
  // 필터의 재료 리스트는 마스터 전체가 아니라 내가 등록한 '보유 재료'만.
  // GET /users/me/ingredients (재료관리 화면과 동일 소스).
  const { data: myIngredientData } = useMyIngredients();
  const myIngredients = myIngredientData?.ingredients ?? [];
  // 백엔드 서버검색 없음 → 로드된 목록에서 제목·카테고리·재료로 클라이언트 필터.
  const recipes = (data?.recipes ?? []).filter((r) => {
    if (query && !r.title.toLowerCase().includes(query)) return false;
    if (selectedCats.size > 0 && !selectedCats.has(r.categoryCode)) return false;
    if (selectedIngs.size > 0 && !r.ingredientNames.some((n) => selectedIngs.has(n))) return false;
    return true;
  });
  const isFull = (data?.totalCount ?? 0) >= MAX_SLOTS;
  const animate = useEnteringOnce('recipes'); // 최초 진입에만 카드 순차 등장

  const sortLabel = sort === 'LATEST' ? '최신순' : '오래된순';
  const removeCat = (c: RecipeCategory) =>
    setSelectedCats((prev) => {
      const next = new Set(prev);
      next.delete(c);
      return next;
    });
  const removeIng = (n: string) =>
    setSelectedIngs((prev) => {
      const next = new Set(prev);
      next.delete(n);
      return next;
    });

  // + 탭 — 슬롯 가득 차면 안내 팝업, 아니면 등록 메뉴 토글
  const onFabPress = () => (isFull ? router.push('/slot-full') : setMenuOpen((o) => !o));

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerClassName="gap-4 px-screen pb-[120px] pt-2"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="title">나의 레시피</AppText>
          <SearchBar
            placeholder="레시피명을 검색해보세요"
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />
          {/* Figma: 1줄 = 총 N개(좌) + 정렬 컴팩트 드롭다운(우), 2줄 = 카테고리·재료 칩 */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] leading-[17px] text-foreground">
                총 {recipes.length}개
              </Text>
              {/* 정렬 — 테두리 없는 컴팩트 드롭다운(최신순 탭 → 등록일순 시트) */}
              <PressableScale
                onPress={() => setSheet('sort')}
                accessibilityRole="button"
                haptic="selection"
                className="h-5 flex-row items-center gap-1"
              >
                <Text className="text-chip text-foreground">{sortLabel}</Text>
                <Image
                  source={require('../assets/images/ic-chevron-down.png')}
                  style={{ width: 20, height: 20 }}
                  tintColor={palette.muted}
                  contentFit="contain"
                />
              </PressableScale>
            </View>
            <View className="flex-row gap-2">
              <FilterChip label="카테고리" onPress={() => setSheet('filter')} />
              <FilterChip label="재료" onPress={() => setSheet('filter')} />
            </View>
            {/* 적용된 필터 — 골드 태그 + × 로 제거 */}
            {selectedCats.size > 0 || selectedIngs.size > 0 ? (
              <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                {[...selectedCats].map((c) => (
                  <ActiveFilterTag
                    key={`c-${c}`}
                    label={RECIPE_CATEGORY_LABEL[c]}
                    onRemove={() => removeCat(c)}
                  />
                ))}
                {[...selectedIngs].map((n) => (
                  <ActiveFilterTag key={`i-${n}`} label={n} onRemove={() => removeIng(n)} />
                ))}
              </View>
            ) : null}
          </View>
          {/* 목록 — 로딩/에러/빈 상태 후 2열 그리드.
              폭(48%)은 Animated 래퍼에 inline style로(애니메이션 노드에 className 금지). */}
          {isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : isError ? (
            <View className="items-center py-20">
              <AppText variant="body" className="text-muted">
                레시피를 불러오지 못했어요.
              </AppText>
            </View>
          ) : recipes.length === 0 ? (
            <View className="items-center py-20">
              <AppText variant="body" className="text-muted">
                {query ? '검색 결과가 없어요.' : '아직 저장한 레시피가 없어요.'}
              </AppText>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-6">
              {recipes.map((r, i) => (
                <Animated.View
                  key={r.recipeId}
                  style={{ width: '48%' }}
                  entering={animate ? FadeInDown.delay(staggerDelay(i)).springify() : undefined}
                >
                  <RecipeCard
                    item={r}
                    onPress={() =>
                      router.push({ pathname: '/recipe-view', params: { id: String(r.recipeId) } })
                    }
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>

        <TabBar active="recipes" />
      </SafeAreaView>

      {/* 팝오버 열림 시 배경 어둡게 + 바깥 탭하면 닫힘 (Figma: #060A19 85%) */}
      {menuOpen ? (
        <Pressable
          className="absolute inset-0 bg-background/85"
          onPress={() => setMenuOpen(false)}
          accessibilityLabel="메뉴 닫기"
        />
      ) : null}

      {/* 플로팅 + 버튼 + 등록 메뉴 */}
      <View
        className="absolute right-5 items-end"
        style={{ bottom: insets.bottom + 90 }}
        pointerEvents="box-none"
      >
        {menuOpen ? (
          <View className="mb-[18px]">
            <AddRecipeMenu
              onSelect={(m) => {
                setMenuOpen(false);
                router.push(m.href);
              }}
            />
          </View>
        ) : null}
        <PressableScale
          onPress={onFabPress}
          haptic="light"
          className="h-14 w-14 items-center justify-center rounded-full bg-primary"
          style={{
            shadowColor: '#000000',
            shadowOpacity: 0.35,
            shadowRadius: 40,
            shadowOffset: { width: 0, height: 20 },
            elevation: 12,
          }}
          accessibilityRole="button"
          accessibilityLabel="레시피 등록"
        >
          <Feather name="plus" size={24} color={palette.ink} />
        </PressableScale>
      </View>

      {/* 카테고리·재료 필터 시트 */}
      {sheet === 'filter' ? (
        <RecipeFilterSheet
          ingredients={myIngredients}
          categories={selectedCats}
          ingredientNames={selectedIngs}
          onCancel={() => setSheet(null)}
          onApply={(cats, ings) => {
            setSelectedCats(cats);
            setSelectedIngs(ings);
            setSheet(null);
          }}
        />
      ) : null}

      {/* 등록일순 정렬 시트 */}
      {sheet === 'sort' ? (
        <RecipeSortSheet
          sort={sort}
          onCancel={() => setSheet(null)}
          onApply={(s) => {
            setSort(s);
            setSheet(null);
          }}
        />
      ) : null}
    </View>
  );
}

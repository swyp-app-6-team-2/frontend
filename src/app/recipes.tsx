import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddRecipeMenu } from '@/components/add-recipe-menu';
import { TabBar } from '@/components/tab-bar';
import { AppText, PressableScale, SearchBar } from '@/components/ui';
import { staggerDelay } from '@/constants/animation';
import { RECIPE_CATEGORY_LABEL } from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useRecipes } from '@/hooks/use-api';
import { useEnteringOnce } from '@/hooks/use-entering-once';
import type { RecipeListItem } from '@/lib/api/types';

const FILTERS = ['카테고리', '재료', '최신순'];

// 저장 슬롯 최대 50개 — 초과 시 slot-full 팝업
const MAX_SLOTS = 50;

// Figma 필터칩 — h36, pill, 투명 bg + 1px border #1E2230(field), gap4, px16.
// 라벨 14px 흰색 + 우측 16px 드롭다운 아이콘. 화살표는 다크 배경에서 보이도록
// muted (Figma 익스포트의 #18181B는 배경과 겹쳐 안 보임).
function FilterChip({ label }: { label: string }) {
  return (
    <PressableScale
      accessibilityRole="button"
      haptic="selection"
      className="h-9 flex-row items-center justify-center gap-1 rounded-pill border border-field px-4"
    >
      <Text className="text-chip text-foreground">{label}</Text>
      <Image
        source={require('../assets/images/ic-chevron-down.png')}
        style={{ width: 16, height: 16 }}
        tintColor={palette.muted}
        contentFit="contain"
      />
    </PressableScale>
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
  const { data, isLoading, isError } = useRecipes();
  const recipes = data?.recipes ?? [];
  const isFull = (data?.totalCount ?? 0) >= MAX_SLOTS;
  const animate = useEnteringOnce('recipes'); // 최초 진입에만 카드 순차 등장

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
          <SearchBar placeholder="레시피명을 검색해보세요" />
          <View className="flex-row gap-2">
            {FILTERS.map((f) => (
              <FilterChip key={f} label={f} />
            ))}
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
                아직 저장한 레시피가 없어요.
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
          accessibilityRole="button"
          accessibilityLabel="레시피 등록"
        >
          <Feather name="plus" size={24} color={palette.ink} />
        </PressableScale>
      </View>
    </View>
  );
}

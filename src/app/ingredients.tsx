import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar } from '@/components/tab-bar';
import { AppText, PressableScale, SearchBar } from '@/components/ui';
import {
  INGREDIENT_CATEGORY_EMOJI,
  INGREDIENT_CATEGORY_LABEL,
  INGREDIENT_CATEGORY_ORDER,
} from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useMyIngredients } from '@/hooks/use-api';
import type { UserIngredient } from '@/lib/api/types';

// Figma 칩 — 이모지 + 이름, bg #1E2230(field), h36, pill, px16.
// 재료관리는 "내가 등록한" 재료만 보여준다 → 전부 보유(흰색) 표시. 삭제 API 없음(표시 전용).
function IngredientChip({ ing }: { ing: UserIngredient }) {
  return (
    <View className="h-9 flex-row items-center gap-1.5 rounded-pill bg-field px-4">
      {/* 백엔드 재료 아이콘(iconUrl) 우선, 없으면 카테고리 이모지로 폴백 */}
      {ing.iconUrl ? (
        <Image
          source={{ uri: ing.iconUrl }}
          style={{ width: 18, height: 18 }}
          contentFit="contain"
          transition={150}
        />
      ) : (
        <Text className="text-[14px]">{INGREDIENT_CATEGORY_EMOJI[ing.categoryCode]}</Text>
      )}
      <Text className="text-[14px] leading-[17px] text-foreground">{ing.name}</Text>
    </View>
  );
}

// 재료관리 — 카테고리별 섹션 + 재료 칩. + FAB → 재료 추가하기(/fridge).
export default function IngredientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  // 내가 등록한 재료만. 마스터 전체가 아니라 GET /users/me/ingredients.
  const { data, isLoading, isError } = useMyIngredients();
  const items = useMemo(() => data?.ingredients ?? [], [data]);

  // 카테고리 순서대로, 항목 있는 섹션만. 검색어는 이름으로 필터(보유 응답엔 별칭 없음).
  const sections = useMemo(
    () =>
      INGREDIENT_CATEGORY_ORDER.map((cat) => ({
        cat,
        items: items.filter(
          (it) => it.categoryCode === cat && (!query || it.name.toLowerCase().includes(query)),
        ),
      })).filter((s) => s.items.length > 0),
    [items, query],
  );

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerClassName="gap-6 px-screen pb-[120px] pt-2"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="title">재료관리</AppText>
          <SearchBar
            placeholder="재료명을 검색해보세요"
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />

          {isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : isError ? (
            <View className="items-center py-20">
              <AppText variant="body" className="text-muted">
                재료를 불러오지 못했어요.
              </AppText>
            </View>
          ) : sections.length === 0 ? (
            <View className="items-center py-20">
              <AppText variant="body" className="text-muted">
                {query ? '검색 결과가 없어요.' : '아직 재료가 없어요.'}
              </AppText>
            </View>
          ) : (
            sections.map((s) => (
              <View key={s.cat} className="gap-3">
                {/* 섹션 라벨 — 이모지 + 카테고리명 */}
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[16px]">{INGREDIENT_CATEGORY_EMOJI[s.cat]}</Text>
                  <AppText variant="body" className="font-medium text-foreground">
                    {INGREDIENT_CATEGORY_LABEL[s.cat]}
                  </AppText>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {s.items.map((ing) => (
                    <IngredientChip key={ing.ingredientId} ing={ing} />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <TabBar active="fridge" />
      </SafeAreaView>

      {/* 플로팅 + 버튼 → 재료 추가하기 */}
      <View
        className="absolute right-5 items-end"
        style={{ bottom: insets.bottom + 90 }}
        pointerEvents="box-none"
      >
        <PressableScale
          onPress={() => router.push('/fridge')}
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
          accessibilityLabel="재료 추가하기"
        >
          <Feather name="plus" size={24} color={palette.ink} />
        </PressableScale>
      </View>
    </View>
  );
}

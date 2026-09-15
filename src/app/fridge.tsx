import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, PressableScale, Screen, SearchBar } from '@/components/ui';
import { staggerDelay } from '@/constants/animation';
import {
  INGREDIENT_CATEGORY_EMOJI,
  INGREDIENT_CATEGORY_LABEL,
  INGREDIENT_CATEGORY_ORDER,
} from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useAddMyIngredients, useIngredients, useMyIngredients } from '@/hooks/use-api';
import { useEnteringOnce } from '@/hooks/use-entering-once';
import type { IngredientCategory } from '@/lib/api/types';

// 재료관리 — 검색 + 카테고리 칩 + 재료 그리드. 재료 마스터(GET /ingredients) 연결.
export default function FridgeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const chipScrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<number, { x: number; w: number }>>({});
  const [active, setActive] = useState(0); // 0 = 전체, 이후 카테고리
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const animate = useEnteringOnce('fridge');

  // 선택한 재료 id 집합. 1개 이상 선택 시 등록하기 활성화.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addMutation = useAddMyIngredients();
  const onRegister = () => {
    if (selected.size === 0 || addMutation.isPending) return;
    // POST /users/me/ingredients. 성공 시 재료관리 목록이 무효화되어 자동 반영된다.
    addMutation.mutate([...selected], { onSuccess: () => router.back() });
  };

  const { data, isLoading, isError } = useIngredients();
  const items = useMemo(() => data?.ingredients ?? [], [data]);
  // 이미 등록한 재료는 추가 목록에서 제외한다. 서버(GET /users/me/ingredients) 기준.
  const { data: mine } = useMyIngredients();
  const owned = useMemo(
    () => new Set((mine?.ingredients ?? []).map((it) => it.ingredientId)),
    [mine],
  );
  const available = useMemo(
    () => items.filter((it) => !owned.has(it.ingredientId)),
    [items, owned],
  );

  // 칩: 전체 + 항목이 있는 카테고리만. category=null 이 전체.
  const chips = useMemo(() => {
    const withItems = INGREDIENT_CATEGORY_ORDER.filter((cat) =>
      available.some((it) => it.categoryCode === cat),
    );
    return [
      { category: null as IngredientCategory | null, label: '전체', count: available.length },
      ...withItems.map((cat) => ({
        category: cat,
        label: INGREDIENT_CATEGORY_LABEL[cat],
        count: available.filter((it) => it.categoryCode === cat).length,
      })),
    ];
  }, [available]);

  const selectedCategory = chips[active]?.category ?? null;
  // 카테고리 + 검색어(이름/별칭) 클라이언트 필터. 백엔드는 재료 검색을 주지 않는다.
  const visible = useMemo(
    () =>
      available.filter((it) => {
        if (selectedCategory && it.categoryCode !== selectedCategory) return false;
        if (
          query &&
          !it.name.toLowerCase().includes(query) &&
          !it.aliases.some((a) => a.toLowerCase().includes(query))
        )
          return false;
        return true;
      }),
    [available, selectedCategory, query],
  );

  // 선택한 칩이 가로 스크롤 가운데로 오도록
  const selectChip = (i: number) => {
    setActive(i);
    const l = chipLayouts.current[i];
    if (l)
      chipScrollRef.current?.scrollTo({
        x: Math.max(0, l.x + l.w / 2 - width / 2),
        animated: true,
      });
  };

  return (
    <Screen title="재료 추가하기" close>
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 pb-4 pt-2"
        >
          <SearchBar
            placeholder="재료명을 검색해보세요"
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
          />

          {/* 카테고리 칩 — 가로 스크롤, 선택=골드 */}
          <ScrollView
            ref={chipScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {chips.map((c, i) => {
              const on = i === active;
              return (
                <PressableScale
                  key={c.label}
                  onPress={() => selectChip(i)}
                  onLayout={(e) => {
                    chipLayouts.current[i] = {
                      x: e.nativeEvent.layout.x,
                      w: e.nativeEvent.layout.width,
                    };
                  }}
                  accessibilityRole="button"
                  haptic="selection"
                  className={`h-9 items-center justify-center rounded-pill border border-field px-4 ${
                    on ? 'bg-primary' : ''
                  }`}
                >
                  <Text
                    className={`text-[14px] leading-[17px] ${on ? 'text-ink' : 'text-foreground'}`}
                  >
                    {c.label} ({c.count})
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>

          {/* 재료 그리드 — 로딩/에러/빈 상태 후 3열 청킹 */}
          {isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : isError ? (
            <View className="items-center py-20">
              <Text className="text-[16px] text-muted">재료를 불러오지 못했어요.</Text>
            </View>
          ) : visible.length === 0 ? (
            <View className="items-center py-20">
              <Text className="text-[16px] text-muted">재료가 없어요.</Text>
            </View>
          ) : (
            <View className="gap-4">
              {Array.from({ length: Math.ceil(visible.length / 3) }, (_, r) => (
                <View key={r} className="flex-row gap-4">
                  {[0, 1, 2].map((c) => {
                    const idx = r * 3 + c;
                    const item = visible[idx];
                    if (!item) return <View key={c} className="flex-1" />;
                    return (
                      // flex(1)는 Animated 노드에 inline style로, 시각 스타일은 안쪽 View에
                      <Animated.View
                        key={c}
                        style={{ flex: 1 }}
                        entering={
                          animate ? FadeInDown.delay(staggerDelay(idx)).springify() : undefined
                        }
                      >
                        <PressableScale
                          onPress={() => toggleSelect(item.ingredientId)}
                          haptic="selection"
                          accessibilityRole="button"
                          accessibilityState={{ selected: selected.has(item.ingredientId) }}
                          className={`aspect-[110/83] w-full items-center justify-center gap-2 rounded-[12px] border-2 bg-popup-button ${
                            selected.has(item.ingredientId)
                              ? 'border-primary'
                              : 'border-transparent'
                          }`}
                        >
                          {/* 백엔드 재료 아이콘(iconUrl) 우선, 없으면 카테고리 이모지 폴백 */}
                          {item.iconUrl ? (
                            <Image
                              source={{ uri: item.iconUrl }}
                              style={{ width: 28, height: 28 }}
                              contentFit="contain"
                              transition={150}
                            />
                          ) : (
                            <Text className="text-[20px]">
                              {INGREDIENT_CATEGORY_EMOJI[item.categoryCode]}
                            </Text>
                          )}
                          <Text
                            numberOfLines={1}
                            className="text-[14px] font-medium leading-[18px] text-foreground"
                          >
                            {item.name}
                          </Text>
                        </PressableScale>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <View className="gap-1 pb-6">
        <Button
          label={
            addMutation.isPending
              ? '등록 중…'
              : selected.size
                ? `등록하기 (${selected.size})`
                : '등록하기'
          }
          disabled={selected.size === 0 || addMutation.isPending}
          onPress={onRegister}
        />
        <PressableScale
          onPress={() => router.push('/add-ingredient')}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="재료가 없어요, 직접 입력할게요"
          className="items-center py-3"
        >
          <Text className="text-[14px] leading-[18px] text-muted">
            재료가 없어요,{' '}
            <Text className="font-medium text-foreground underline">직접 입력할게요</Text>
          </Text>
        </PressableScale>
      </View>
    </Screen>
  );
}

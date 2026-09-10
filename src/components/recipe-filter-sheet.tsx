import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';

import {
  INGREDIENT_CATEGORY_EMOJI,
  RECIPE_CATEGORY_LABEL,
  RECIPE_CATEGORY_ORDER,
} from '@/constants/labels';
import type { Ingredient, RecipeCategory, RecipeListSort } from '@/lib/api/types';

import { AppText } from './ui';

// 하단 시트 껍데기 — 딤 배경 + (튕김 없이) 스르륵 슬라이드업 + 취소/확인 버튼.
function SheetShell({
  onCancel,
  onConfirm,
  children,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
}) {
  return (
    <Modal transparent visible animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(150)} className="flex-1 bg-background/85">
        <Pressable className="flex-1" onPress={onCancel} accessibilityLabel="닫기" />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(260).easing(Easing.out(Easing.cubic))}
        className="absolute inset-x-0 bottom-0 rounded-t-[20px] bg-field"
      >
        <View className="px-screen pt-6">{children}</View>
        <View className="flex-row gap-3 px-screen pb-8 pt-4">
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            className="h-[52px] flex-1 items-center justify-center rounded-pill bg-popup-button active:opacity-80"
          >
            <Text className="text-[16px] font-semibold text-popup-button-text">취소</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            accessibilityRole="button"
            className="h-[52px] flex-1 items-center justify-center rounded-pill bg-primary active:opacity-90"
          >
            <Text className="text-[16px] font-semibold text-ink">확인</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// 토글 칩 — 선택 시 골드, 미선택 시 아웃라인.
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`h-9 flex-row items-center justify-center gap-1.5 rounded-pill px-4 active:opacity-80 ${
        active ? 'bg-primary' : 'border border-muted'
      }`}
    >
      <Text className={`text-[14px] leading-[17px] ${active ? 'text-ink' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

const toggle = <T,>(set: Set<T>, v: T) => {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
};

// 카테고리 + 재료 필터 시트 — 카테고리/재료 칩 탭 시.
export function RecipeFilterSheet({
  ingredients,
  categories,
  ingredientNames,
  onCancel,
  onApply,
}: {
  ingredients: Ingredient[];
  categories: Set<RecipeCategory>;
  ingredientNames: Set<string>;
  onCancel: () => void;
  onApply: (cats: Set<RecipeCategory>, ings: Set<string>) => void;
}) {
  const [cats, setCats] = useState(categories);
  const [ings, setIngs] = useState(ingredientNames);

  return (
    <SheetShell onCancel={onCancel} onConfirm={() => onApply(cats, ings)}>
      {/* 카테고리 */}
      <AppText variant="body" className="text-foreground">
        카테고리
      </AppText>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {RECIPE_CATEGORY_ORDER.map((code) => (
          <Chip
            key={code}
            label={RECIPE_CATEGORY_LABEL[code]}
            active={cats.has(code)}
            onPress={() => setCats((s) => toggle(s, code))}
          />
        ))}
      </View>

      {/* 재료 */}
      <AppText variant="body" className="mt-6 text-foreground">
        재료
      </AppText>
      <ScrollView className="mt-4 max-h-[200px]" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap gap-2">
          {ingredients.map((ing) => (
            <Chip
              key={ing.ingredientId}
              label={`${INGREDIENT_CATEGORY_EMOJI[ing.categoryCode]} ${ing.name}`}
              active={ings.has(ing.name)}
              onPress={() => setIngs((s) => toggle(s, ing.name))}
            />
          ))}
        </View>
      </ScrollView>
    </SheetShell>
  );
}

// 정렬 시트 — 최신순 칩 탭 시. 등록일순: 최신순 / 오래된순 (라디오).
const SORT_OPTIONS: { key: RecipeListSort; label: string }[] = [
  { key: 'LATEST', label: '최신순' },
  { key: 'OLDEST', label: '오래된순' },
];

export function RecipeSortSheet({
  sort,
  onCancel,
  onApply,
}: {
  sort: RecipeListSort;
  onCancel: () => void;
  onApply: (sort: RecipeListSort) => void;
}) {
  const [sel, setSel] = useState(sort);

  return (
    <SheetShell onCancel={onCancel} onConfirm={() => onApply(sel)}>
      <AppText variant="body" className="text-foreground">
        등록일순
      </AppText>
      <View className="mt-4 flex-row gap-2">
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.key}
            label={opt.label}
            active={sel === opt.key}
            onPress={() => setSel(opt.key)}
          />
        ))}
      </View>
    </SheetShell>
  );
}

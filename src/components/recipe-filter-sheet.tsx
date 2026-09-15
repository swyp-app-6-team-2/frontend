import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  INGREDIENT_CATEGORY_EMOJI,
  RECIPE_CATEGORY_LABEL,
  RECIPE_CATEGORY_ORDER,
} from '@/constants/labels';
import type { RecipeCategory, RecipeListSort, UserIngredient } from '@/lib/api/types';

import { AppText, SheetShell } from './ui';

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
  ingredients: UserIngredient[];
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
        {ingredients.length === 0 ? (
          <Text className="py-2 text-[14px] leading-[20px] text-muted">
            보유 재료가 없어요. 재료 추가하기에서 재료를 담아주세요.
          </Text>
        ) : (
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
        )}
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
      {/* Figma: 등록일순(16 medium) + 풀폭 가운데정렬 행, 사이 구분선 #3F4250 */}
      <AppText variant="body" className="text-foreground">
        등록일순
      </AppText>
      <View className="mb-9 mt-10">
        {SORT_OPTIONS.map((opt, i) => (
          <View key={opt.key}>
            {i > 0 ? <View className="my-5 h-px bg-disabled" /> : null}
            <Pressable
              onPress={() => setSel(opt.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: sel === opt.key }}
              className="h-12 items-center justify-center active:opacity-80"
            >
              <Text
                className={`text-[14px] leading-[17px] ${
                  sel === opt.key ? 'text-foreground' : 'text-muted'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </SheetShell>
  );
}

import type { IngredientCategory, RecipeCategory } from '@/lib/api/types';

// enum code → 한글 표시 라벨. 백엔드가 코드를 주고 표시는 프론트가 결정한다.

export const RECIPE_CATEGORY_LABEL: Record<RecipeCategory, string> = {
  KOREAN: '한식',
  WESTERN: '양식',
  CHINESE: '중식',
  JAPANESE: '일식',
  BUNSIK: '분식',
  ASIAN: '아시안',
  OTHER: '기타',
};

// 레시피 카테고리 선택 순서(직접 입력 폼 등).
export const RECIPE_CATEGORY_ORDER: RecipeCategory[] = [
  'KOREAN',
  'WESTERN',
  'CHINESE',
  'JAPANESE',
  'BUNSIK',
  'ASIAN',
  'OTHER',
];

export const INGREDIENT_CATEGORY_LABEL: Record<IngredientCategory, string> = {
  MEAT: '육류',
  SEAFOOD: '해산물',
  VEGETABLE: '채소',
  SAUCE: '양념',
  ETC: '기타',
};

// 재료 카테고리 표시 순서(백엔드 정렬과 동일).
export const INGREDIENT_CATEGORY_ORDER: IngredientCategory[] = [
  'MEAT',
  'SEAFOOD',
  'VEGETABLE',
  'SAUCE',
  'ETC',
];

// 임시 아이콘 — 백엔드는 재료별 이모지를 주지 않는다(code만). 재료 아이콘셋이 생기기 전까지
// 카테고리 단위 이모지로 대체. (code→아이콘 매핑이 준비되면 교체)
export const INGREDIENT_CATEGORY_EMOJI: Record<IngredientCategory, string> = {
  MEAT: '🥩',
  SEAFOOD: '🦐',
  VEGETABLE: '🥬',
  SAUCE: '🧂',
  ETC: '🍽️',
};

// 커스텀(직접 입력) 재료 — 카테고리가 없다(categoryCode=null). 섹션/칩 폴백.
export const CUSTOM_INGREDIENT_LABEL = '직접 입력';
export const CUSTOM_INGREDIENT_EMOJI = '📝';

/** 재료 카테고리 이모지 — 커스텀(null)은 직접 입력 폴백 이모지. */
export function ingredientCategoryEmoji(categoryCode: IngredientCategory | null): string {
  return categoryCode ? INGREDIENT_CATEGORY_EMOJI[categoryCode] : CUSTOM_INGREDIENT_EMOJI;
}

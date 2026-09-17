import {
  CUSTOM_INGREDIENT_EMOJI,
  INGREDIENT_CATEGORY_EMOJI,
  INGREDIENT_CATEGORY_LABEL,
  INGREDIENT_CATEGORY_ORDER,
  ingredientCategoryEmoji,
  RECIPE_CATEGORY_LABEL,
  RECIPE_CATEGORY_ORDER,
} from '@/constants/labels';
import type { IngredientCategory, RecipeCategory } from '@/lib/api/types';

// 라벨 맵은 enum 계약과 1:1이어야 한다. 백엔드가 코드를 추가/변경했는데 프론트 맵을
// 안 맞추면 화면에 undefined가 뜨므로, "모든 코드가 라벨/순서에 존재"를 강제한다.

const RECIPE_CODES: RecipeCategory[] = [
  'KOREAN',
  'WESTERN',
  'CHINESE',
  'JAPANESE',
  'BUNSIK',
  'ASIAN',
  'OTHER',
];
const INGREDIENT_CODES: IngredientCategory[] = ['MEAT', 'SEAFOOD', 'VEGETABLE', 'SAUCE', 'ETC'];

describe('RECIPE_CATEGORY 라벨/순서', () => {
  it('모든 코드에 한글 라벨이 있다', () => {
    for (const code of RECIPE_CODES) {
      expect(RECIPE_CATEGORY_LABEL[code]).toBeTruthy();
    }
  });

  it('ORDER가 전체 코드를 중복 없이 담는다', () => {
    expect(RECIPE_CATEGORY_ORDER).toHaveLength(RECIPE_CODES.length);
    expect(new Set(RECIPE_CATEGORY_ORDER).size).toBe(RECIPE_CODES.length);
    expect(new Set(RECIPE_CATEGORY_ORDER)).toEqual(new Set(RECIPE_CODES));
  });

  it('라벨 맵에 계약 외 키가 없다', () => {
    expect(new Set(Object.keys(RECIPE_CATEGORY_LABEL))).toEqual(new Set(RECIPE_CODES));
  });
});

describe('INGREDIENT_CATEGORY 라벨/이모지/순서', () => {
  it('모든 코드에 라벨과 이모지가 있다', () => {
    for (const code of INGREDIENT_CODES) {
      expect(INGREDIENT_CATEGORY_LABEL[code]).toBeTruthy();
      expect(INGREDIENT_CATEGORY_EMOJI[code]).toBeTruthy();
    }
  });

  it('ORDER는 백엔드 정렬(MEAT→SEAFOOD→VEGETABLE→SAUCE→ETC)과 동일하다', () => {
    expect(INGREDIENT_CATEGORY_ORDER).toEqual(['MEAT', 'SEAFOOD', 'VEGETABLE', 'SAUCE', 'ETC']);
  });

  it('ETC(기타)는 항상 마지막이다', () => {
    expect(INGREDIENT_CATEGORY_ORDER[INGREDIENT_CATEGORY_ORDER.length - 1]).toBe('ETC');
    expect(RECIPE_CATEGORY_ORDER[RECIPE_CATEGORY_ORDER.length - 1]).toBe('OTHER');
  });

  it('ingredientCategoryEmoji: 마스터는 해당 이모지, 커스텀(null)은 직접입력 폴백', () => {
    for (const code of INGREDIENT_CODES) {
      expect(ingredientCategoryEmoji(code)).toBe(INGREDIENT_CATEGORY_EMOJI[code]);
    }
    // 커스텀 재료는 categoryCode=null → 폴백 이모지(화면 undefined 방지)
    expect(ingredientCategoryEmoji(null)).toBe(CUSTOM_INGREDIENT_EMOJI);
    expect(CUSTOM_INGREDIENT_EMOJI).toBeTruthy();
  });
});

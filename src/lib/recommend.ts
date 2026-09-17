import type { RecipeListItem, RecipeRecommendationResponse, RecommendationMode } from './api/types';

// 홈 "랜덤으로 골라줘 / 내재료로 골라줘" 추천 로직(순수 함수 — 화면 밖에서 단위 테스트 가능).

/** 추천 옵션 라벨 → 백엔드 추천 방식. 첫 옵션(랜덤)만 RANDOM, 나머지는 재료 기반. */
export function recommendationModeFor(
  label: string,
  options: readonly string[],
): RecommendationMode {
  return label === options[0] ? 'RANDOM' : 'INGREDIENT_BASED';
}

/**
 * 추천 응답(백엔드) → RecommendPopup이 받는 목록아이템 형태로 매핑.
 * category→categoryCode, thumbnailUrl→coverImageUrl, mainIngredients→ingredientNames.
 */
export function recommendationToListItem(r: RecipeRecommendationResponse): RecipeListItem {
  return {
    recipeId: r.recipeId,
    title: r.title,
    categoryCode: r.category,
    coverImageUrl: r.thumbnailUrl,
    ingredientNames: r.mainIngredients,
  };
}

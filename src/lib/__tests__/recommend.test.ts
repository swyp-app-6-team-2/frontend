import type { RecipeRecommendationResponse } from '@/lib/api/types';
import { recommendationModeFor, recommendationToListItem } from '@/lib/recommend';

const RECO = ['랜덤으로 골라줘', '내재료로 골라줘'];

describe('recommendationModeFor (홈 추천 옵션 → 백엔드 방식)', () => {
  it('첫 옵션(랜덤)은 RANDOM', () => {
    expect(recommendationModeFor(RECO[0], RECO)).toBe('RANDOM');
  });
  it('그 외(내재료)는 INGREDIENT_BASED', () => {
    expect(recommendationModeFor(RECO[1], RECO)).toBe('INGREDIENT_BASED');
  });
  it('알 수 없는 라벨도 RANDOM 아님 → INGREDIENT_BASED로 폴백', () => {
    expect(recommendationModeFor('기타', RECO)).toBe('INGREDIENT_BASED');
  });
});

describe('recommendationToListItem (추천 응답 → 팝업 목록아이템)', () => {
  it('필드를 팝업 스키마로 매핑한다(category→categoryCode 등)', () => {
    const res: RecipeRecommendationResponse = {
      recipeId: 7,
      title: '대파라면',
      category: 'KOREAN',
      thumbnailUrl: 'https://cdn/x.jpg',
      mainIngredients: ['라면', '계란', '대파'],
    };
    expect(recommendationToListItem(res)).toEqual({
      recipeId: 7,
      title: '대파라면',
      categoryCode: 'KOREAN',
      coverImageUrl: 'https://cdn/x.jpg',
      thumbnailUrl: null,
      ingredientNames: ['라면', '계란', '대파'],
    });
  });

  it('썸네일 없으면 coverImageUrl은 null(카드가 플레이스홀더로 그림)', () => {
    const res: RecipeRecommendationResponse = {
      recipeId: 1,
      title: '김치볶음밥',
      category: 'OTHER',
      thumbnailUrl: null,
      mainIngredients: [],
    };
    const item = recommendationToListItem(res);
    expect(item.coverImageUrl).toBeNull();
    expect(item.ingredientNames).toEqual([]);
  });
});

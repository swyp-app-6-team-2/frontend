import { queryKeys } from '@/hooks/use-api';

// queryKey는 캐시 무효화의 계약이다. 구조가 흔들리면 invalidateQueries가 조용히 빗나가므로
// 각 키의 접두사·직렬화(파라미터 없을 때 빈 객체/문자열)를 고정한다.

describe('queryKeys', () => {
  it('recipes: 파라미터 없으면 빈 객체로 정규화', () => {
    expect(queryKeys.recipes()).toEqual(['recipes', {}]);
    expect(queryKeys.recipes({ sort: 'LATEST' })).toEqual(['recipes', { sort: 'LATEST' }]);
  });

  it('단건 키는 [접두사, id] 형태', () => {
    expect(queryKeys.recipe(7)).toEqual(['recipe', 7]);
    expect(queryKeys.cookHistories(7)).toEqual(['cook-histories', 7]);
    expect(queryKeys.inquiry(3)).toEqual(['inquiry', 3]);
    expect(queryKeys.ingestionJob(9)).toEqual(['ingestion-job', 9]);
  });

  it('myIngredients: searchQuery 없으면 빈 문자열로 정규화', () => {
    expect(queryKeys.myIngredients()).toEqual(['my-ingredients', '']);
    expect(queryKeys.myIngredients('양파')).toEqual(['my-ingredients', '양파']);
  });

  it('무인자 키들은 안정적인 단일 세그먼트', () => {
    expect(queryKeys.ingredients()).toEqual(['ingredients']);
    expect(queryKeys.me()).toEqual(['me']);
    expect(queryKeys.notificationSettings()).toEqual(['notification-settings']);
  });

  it('inquiries: 파라미터 정규화', () => {
    expect(queryKeys.inquiries()).toEqual(['inquiries', {}]);
    expect(queryKeys.inquiries({ page: 0 })).toEqual(['inquiries', { page: 0 }]);
  });
});

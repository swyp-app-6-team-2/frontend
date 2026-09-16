import { apiFetch } from '@/lib/api/client';
import {
  cookingApi,
  inquiryApi,
  myIngredientApi,
  notificationApi,
  recipeApi,
} from '@/lib/api/endpoints';
import type {
  InquiryCreateRequest,
  NotificationSettings,
  RecipeCreateRequest,
} from '@/lib/api/types';

// client(apiFetch)를 목킹해 각 엔드포인트가 올바른 경로·메서드·body·query로 호출하는지만 검증한다.
// (jest.mock은 babel이 import 위로 hoist하므로 여기 위치해도 적용된다.)
jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
  uploadToGcs: jest.fn(),
}));

const mock = apiFetch as jest.Mock;
beforeEach(() => mock.mockReset());

describe('recipeApi', () => {
  it('list는 query로 페이지 파라미터를 넘긴다', () => {
    recipeApi.list({ sort: 'LATEST', page: 2 });
    expect(mock).toHaveBeenCalledWith('/recipes', { query: { sort: 'LATEST', page: 2 } });
  });
  it('detail/remove는 경로에 id를 박는다', () => {
    recipeApi.detail(5);
    expect(mock).toHaveBeenCalledWith('/recipes/5');
    recipeApi.remove(5);
    expect(mock).toHaveBeenCalledWith('/recipes/5', { method: 'DELETE' });
  });
  it('create는 POST + body', () => {
    const body: RecipeCreateRequest = { title: '김치찌개', categoryCode: 'KOREAN' };
    recipeApi.create(body);
    expect(mock).toHaveBeenCalledWith('/recipes', { method: 'POST', body });
  });
});

describe('cookingApi (레시피 하위 중첩 경로)', () => {
  it('create는 /recipes/{id}/cook-histories POST', () => {
    cookingApi.create(7, { memo: '맛있었음' });
    expect(mock).toHaveBeenCalledWith('/recipes/7/cook-histories', {
      method: 'POST',
      body: { memo: '맛있었음' },
    });
  });
});

describe('myIngredientApi (보유 재료)', () => {
  it('list: searchQuery 없으면 query undefined', () => {
    myIngredientApi.list();
    expect(mock).toHaveBeenCalledWith('/users/me/ingredients', { query: undefined });
  });
  it('list: searchQuery 있으면 query에 실어 보낸다', () => {
    myIngredientApi.list('양파');
    expect(mock).toHaveBeenCalledWith('/users/me/ingredients', { query: { searchQuery: '양파' } });
  });
  it('add: POST + ingredientIds', () => {
    myIngredientApi.add([1, 2, 3]);
    expect(mock).toHaveBeenCalledWith('/users/me/ingredients', {
      method: 'POST',
      body: { ingredientIds: [1, 2, 3] },
    });
  });
});

describe('inquiryApi (문의)', () => {
  it('create는 /inquiries POST', () => {
    const body: InquiryCreateRequest = { type: 'BUG', title: '제목', content: '내용입니다' };
    inquiryApi.create(body);
    expect(mock).toHaveBeenCalledWith('/inquiries', { method: 'POST', body });
  });
  it('list는 query로 페이징, detail은 경로 id', () => {
    inquiryApi.list({ page: 1 });
    expect(mock).toHaveBeenCalledWith('/inquiries', { query: { page: 1 } });
    inquiryApi.detail(42);
    expect(mock).toHaveBeenCalledWith('/inquiries/42');
  });
});

describe('notificationApi (알림)', () => {
  it('saveSettings는 PUT 전체 교체', () => {
    const body: NotificationSettings = { enabled: true, weekdays: [], timeSlots: [] };
    notificationApi.saveSettings(body);
    expect(mock).toHaveBeenCalledWith('/notification-settings', { method: 'PUT', body });
  });
  it('markOpened는 /notifications/{id}/open POST', () => {
    notificationApi.markOpened(3);
    expect(mock).toHaveBeenCalledWith('/notifications/3/open', { method: 'POST' });
  });
});

/** @type {import('jest').Config} */
// 로직/데이터 레이어 유닛 테스트. jest-expo 프리셋으로 RN/Expo 모듈 트랜스폼을 처리하고,
// tsconfig의 `@/` 별칭을 moduleNameMapper로 매핑한다.
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  clearMocks: true,
};

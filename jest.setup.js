// 테스트 전역 셋업. client.ts가 모듈 로드 시점에 읽는 API BASE를 고정한다.
process.env.EXPO_PUBLIC_API_BASE_URL = 'http://test.local';

// __DEV__ 전용 진단 로그([api] BASE, [refresh][diag] …)를 테스트 출력에서 끈다(= 프로덕션과 동일).
global.__DEV__ = false;

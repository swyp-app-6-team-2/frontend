import { Slot } from 'expo-router';

// (tabs)는 진입 리다이렉트 전용 그룹 — index.tsx가 세션에 따라 로그인/온보딩/홈으로 흘려보낸다.
// 실제 앱 탭은 최상위 라우트(home·fridge·ingredients·recipes·my) + 커스텀 @/components/tab-bar가
// 담당한다. 예전 스타터 템플릿의 NativeTabs(Home/Explore) 탭바 잔재를 제거하고 통과 렌더만 한다.
export default function TabsLayout() {
  return <Slot />;
}

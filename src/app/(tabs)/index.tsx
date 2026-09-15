import { Redirect } from 'expo-router';

// 앱 진입점 — 로그인 화면으로 바로 이동. (개발용 페이지 허브는 제거)
export default function Index() {
  return <Redirect href="/login" />;
}

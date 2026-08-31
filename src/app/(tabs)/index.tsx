import { View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { ListRow, Screen } from '@/components/ui';

/**
 * Dev page hub — every app page is listed here so it's reachable on the
 * simulator. To add a new page:
 *   1. create src/app/<name>.tsx exporting a <Screen>…</Screen>
 *   2. add a { href, label } line below
 */
const PAGES: { href: Href; label: string }[] = [
  { href: '/login', label: '로그인' },
  { href: '/onboarding', label: '온보딩 튜토리얼' },
  { href: '/home', label: '홈' },
  { href: '/fridge', label: '재료관리 (내 냉장고)' },
  { href: '/recipes', label: '나의 레시피' },
  { href: '/my', label: '마이' },
  { href: '/profile-edit', label: '↳ 프로필 수정' },
  { href: '/login-manage', label: '↳ 로그인 관리' },
  { href: '/inquiry', label: '↳ 문의하기' },
  { href: '/add-recipe', label: '＋ 레시피 등록 (플로우 시작)' },
  { href: '/add-recipe-url', label: '↳ URL로 등록' },
  { href: '/add-recipe-image', label: '↳ 이미지로 등록' },
  { href: '/add-recipe-loading', label: '↳ 등록 로딩' },
  { href: '/url-failed', label: '↳ 실패: 지원하지 않는 링크' },
  { href: '/ocr-failed', label: '↳ 실패: 텍스트 인식 실패' },
  { href: '/slot-full', label: '↳ 실패: 저장 슬롯 가득' },
  { href: '/design-system', label: '디자인 시스템 (개발용)' },
];

export default function HomeHub() {
  return (
    <Screen title="페이지" scroll>
      {/* 리스트 행 간격 32px(gap-8)로 통일 */}
      <View className="gap-8">
        {PAGES.map((page) => (
          <Link key={String(page.href)} href={page.href} asChild>
            <ListRow label={page.label} />
          </Link>
        ))}
      </View>
    </Screen>
  );
}

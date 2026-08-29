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
  { href: '/design-system', label: '디자인 시스템' },
  { href: '/recipe-detail', label: '레시피 내용 확인' },
  { href: '/my-trade', label: '나의 거래' },
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

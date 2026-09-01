import { Pressable, Text, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Link, type Href } from 'expo-router';

import { palette } from '@/constants/tokens';

export type TabKey = 'home' | 'fridge' | 'recipes' | 'my';

const TABS: { key: TabKey; icon: ImageSource; label: string; href: Href }[] = [
  { key: 'home', icon: require('../assets/images/ic-tab-home.png'), label: '홈', href: '/home' },
  { key: 'fridge', icon: require('../assets/images/ic-tab-fridge.png'), label: '재료관리', href: '/fridge' }, // prettier-ignore
  { key: 'recipes', icon: require('../assets/images/ic-tab-recipes.png'), label: '나의 레시피', href: '/recipes' }, // prettier-ignore
  { key: 'my', icon: require('../assets/images/ic-tab-my.png'), label: 'MY', href: '/my' },
];

// 떠 있는 pill 탭바 (Figma 619:9650 공통 푸터, 362×66). 아이콘은 tintColor로
// 색 입힘 — 활성=골드(primary), 비활성=tab-inactive(#727272). 라벨도 동일 색.
export function TabBar({ active }: { active: TabKey }) {
  return (
    <View
      className="mx-5 mb-2 flex-row rounded-pill bg-field px-5 py-3"
      style={{ boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.35)' }}
    >
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Link key={t.key} href={t.href} asChild>
            <Pressable className="flex-1 items-center gap-1" accessibilityRole="button">
              <Image
                source={t.icon}
                style={{ width: 24, height: 24 }}
                tintColor={on ? palette.primary : palette.tabInactive}
                contentFit="contain"
              />
              <Text
                numberOfLines={1}
                className={`text-[12px] font-normal leading-[14px] ${on ? 'text-primary' : 'text-tab-inactive'}`}
              >
                {t.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

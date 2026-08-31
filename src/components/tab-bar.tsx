import { Pressable, Text, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Link, type Href } from 'expo-router';

import { palette } from '@/constants/tokens';

export type TabKey = 'home' | 'fridge' | 'recipes' | 'my';

const TABS: { key: TabKey; icon: ImageSource; label: string; href: Href }[] = [
  { key: 'home', icon: require('../assets/images/ic-tab-home.png'), label: '홈', href: '/home' },
  { key: 'fridge', icon: require('../assets/images/ic-tab-fridge.png'), label: '재료관리', href: '/fridge' }, // prettier-ignore
  { key: 'recipes', icon: require('../assets/images/ic-tab-recipes.png'), label: '나의 레시피', href: '/recipes' }, // prettier-ignore
  { key: 'my', icon: require('../assets/images/ic-tab-my.png'), label: '마이', href: '/my' },
];

// 떠 있는 둥근 탭바. 실제 Material Symbols 아이콘을 tintColor로 색 입힘 (활성=골드, 비활성=muted).
export function TabBar({ active }: { active: TabKey }) {
  return (
    <View
      className="mx-4 mb-2 flex-row rounded-3xl px-2 py-2.5"
      style={{ backgroundColor: 'rgba(18,26,48,0.92)' }}
    >
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <Link key={t.key} href={t.href} asChild>
            <Pressable className="flex-1 items-center gap-1 py-1" accessibilityRole="button">
              <Image
                source={t.icon}
                style={{ width: 24, height: 24 }}
                tintColor={on ? palette.primary : palette.muted}
                contentFit="contain"
              />
              <Text className={`text-[11px] ${on ? 'font-semibold text-primary' : 'text-muted'}`}>
                {t.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

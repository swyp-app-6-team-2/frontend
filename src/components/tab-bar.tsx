import { Pressable, Text, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { Link, useRouter, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { palette } from '@/constants/tokens';
import { isGuest, promptGuestLogin } from '@/lib/guest';

export type TabKey = 'home' | 'fridge' | 'recipes' | 'my';

// guestGated: 계정 기능이라 게스트는 로그인 유도(재료관리·마이). 홈·나의 레시피는 로컬로 동작.
const TABS: { key: TabKey; icon: ImageSource; label: string; href: Href; guestGated?: boolean }[] =
  [
    { key: 'home', icon: require('../assets/images/ic-tab-home.png'), label: '홈', href: '/home' },
    { key: 'recipes', icon: require('../assets/images/ic-tab-recipes.png'), label: '나의 레시피', href: '/recipes' }, // prettier-ignore
    { key: 'fridge', icon: require('../assets/images/ic-tab-fridge.png'), label: '재료관리', href: '/ingredients', guestGated: true }, // prettier-ignore
    {
      key: 'my',
      icon: require('../assets/images/ic-tab-my.png'),
      label: '마이',
      href: '/my',
      guestGated: true,
    },
  ];

// 떠 있는 pill 탭바 (Figma 619:9650 공통 푸터, 362×68). 아이콘은 tintColor로
// 색 입힘 — 활성=골드(primary), 비활성=tab-inactive(#505050). 라벨도 동일 색.
export function TabBar({ active }: { active: TabKey }) {
  const router = useRouter();
  const guest = isGuest();
  return (
    <View
      className="mx-5 mb-2 flex-row rounded-pill bg-field px-5 py-[13px]"
      style={{ boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.35)' }}
    >
      {TABS.map((t) => {
        const on = t.key === active;
        const inner = (
          <>
            {t.key === 'home' && !on ? (
              // 홈 비활성 = 아웃라인 집 (활성은 채워진 아이콘)
              <Feather name="home" size={24} color={palette.tabInactive} />
            ) : (
              <Image
                source={t.icon}
                style={{ width: 24, height: 24 }}
                tintColor={on ? palette.primary : palette.tabInactive}
                contentFit="contain"
              />
            )}
            <Text
              numberOfLines={1}
              className={`text-[12px] leading-[14px] ${on ? 'font-medium text-primary' : 'font-normal text-tab-inactive'}`}
            >
              {t.label}
            </Text>
          </>
        );
        // 게스트 + 계정 기능 탭 → 이동 대신 로그인 유도(빈 401 화면 방지).
        if (guest && t.guestGated) {
          return (
            <Pressable
              key={t.key}
              onPress={() =>
                promptGuestLogin(
                  () => router.push('/login'),
                  `${t.label}은(는) 로그인 후 이용할 수 있어요.`,
                )
              }
              className="flex-1 items-center gap-1"
              accessibilityRole="button"
            >
              {inner}
            </Pressable>
          );
        }
        return (
          <Link key={t.key} href={t.href} asChild>
            <Pressable className="flex-1 items-center gap-1" accessibilityRole="button">
              {inner}
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

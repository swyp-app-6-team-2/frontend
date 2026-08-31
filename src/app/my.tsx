import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabBar } from '@/components/tab-bar';
import { AppText, Chevron, ListRow } from '@/components/ui';

// 마이페이지 — 프로필 + 남은 별(슬롯) + 설정 메뉴.
// 하단 메뉴 (Figma 리스트, gap 32).
const MENU: { label: string; href?: Href }[] = [
  { label: '알림 설정' },
  { label: '로그인 관리' },
  { label: '이용 내역' },
  { label: '약관', href: '/terms' },
  { label: '문의하기' },
];

export default function MyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          contentContainerClassName="gap-4 px-screen pb-[120px] pt-2"
          showsVerticalScrollIndicator={false}
        >
          {/* 헤더 (Figma 원본은 "나의 거래" — 마이 탭에 맞춰 "마이페이지") */}
          <AppText variant="title">마이페이지</AppText>

          {/* 프로필 행: 아바타 + 닉네임 + 카카오 연동 배지 */}
          <Pressable
            className="flex-row items-center justify-between active:opacity-80"
            accessibilityRole="button"
            onPress={() => router.push('/profile-edit')}
          >
            <View className="flex-row items-center gap-4">
              {/* 아바타 자리 (실제 이미지 자산 없음 → 비활성 색 원) */}
              <View className="h-[68px] w-[68px] rounded-full bg-disabled" />
              <View className="flex-row items-center gap-1.5">
                <AppText variant="subheading">별따먹는사람</AppText>
                {/* 카카오 로그인 배지 — 아이콘 라이브러리 없음, 이모지 임시 */}
                <View className="h-4 w-4 items-center justify-center rounded-full bg-primary">
                  <Text className="text-[9px]">💬</Text>
                </View>
              </View>
            </View>
            <Chevron direction="right" className="text-muted" />
          </Pressable>

          {/* 남은 별(슬롯) 카드 + 별 확장 버튼 */}
          <View className="flex-row items-center justify-between rounded-lg bg-field px-4 py-3.5">
            <View className="flex-row items-center gap-1">
              <AppText variant="body" className="text-muted">
                남은 별
              </AppText>
              <AppText variant="body" className="font-bold">
                35
              </AppText>
            </View>
            <Pressable
              className="rounded-pill border border-primary bg-surface px-4 py-2.5 active:opacity-80"
              accessibilityRole="button"
              onPress={() => router.push('/slot-full')}
            >
              <AppText variant="chip">별 확장</AppText>
            </Pressable>
          </View>

          {/* 설정 메뉴 (행 간격 32px) */}
          <View className="mt-2 gap-8">
            {MENU.map((item) => (
              <ListRow
                key={item.label}
                label={item.label}
                onPress={() => (item.href ? router.push(item.href) : undefined)}
              />
            ))}
          </View>
        </ScrollView>

        <TabBar active="my" />
      </SafeAreaView>
    </View>
  );
}

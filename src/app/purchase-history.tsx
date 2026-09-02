import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText, Screen } from '@/components/ui';
import { staggerDelay } from '@/constants/animation';
import { useEnteringOnce } from '@/hooks/use-entering-once';

// 구매내역 — 남은 별 + 별 슬롯 확장 결제 이력 (Figma). mock 데이터.
type Purchase = { title: string; amount: string; date: string; status: string };

const REMAINING_STARS = 35;

const PURCHASES: Purchase[] = [
  { title: '미디엄팩 + 30개', amount: '2,400원', date: '2026년 7월 2일 12:37', status: '결제완료' },
  {
    title: '미디엄팩 + 30개',
    amount: '2,400원',
    date: '2026년 6월 20일 09:12',
    status: '결제완료',
  },
  { title: '미디엄팩 + 30개', amount: '2,400원', date: '2026년 5월 8일 21:05', status: '결제완료' },
];

export default function PurchaseHistoryScreen() {
  const animate = useEnteringOnce('purchase-history'); // 최초 진입에만 순차 등장
  return (
    <Screen title="구매내역" back scroll>
      {/* 남은 별 카드 + 별 확장 버튼 */}
      <View className="mt-2 flex-row items-center justify-between rounded-[12px] bg-field p-4">
        <View className="flex-row items-center gap-1">
          <AppText variant="body" className="text-muted">
            남은 별
          </AppText>
          <Text className="text-[16px] font-bold leading-[21px] text-foreground">
            {REMAINING_STARS}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          className="rounded-pill border border-primary bg-surface px-4 py-2.5 active:opacity-80"
        >
          <Text className="text-[14px] leading-[18px] text-foreground">별 확장</Text>
        </Pressable>
      </View>

      {/* 구매 내역 — 각 행 상품/가격 + 날짜/상태, 하단 구분선 */}
      <View>
        {PURCHASES.map((p, i) => (
          <Animated.View
            key={`${p.date}-${i}`}
            entering={animate ? FadeInDown.delay(staggerDelay(i)).springify() : undefined}
          >
            {/* 시각 스타일은 안쪽 View에(애니메이션 노드엔 className 얹지 않음) */}
            <View className="gap-2 border-b border-disabled py-7">
              <View className="flex-row items-center justify-between">
                <Text className="text-[16px] font-medium leading-[21px] text-foreground">
                  {p.title}
                </Text>
                <Text className="text-[16px] font-medium leading-[21px] text-foreground">
                  {p.amount}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-medium leading-[18px] text-body-muted">
                  {p.date}
                </Text>
                <Text className="text-[14px] font-medium leading-[18px] text-success">
                  {p.status}
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

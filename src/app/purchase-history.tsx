import { View } from 'react-native';

import { AppText, ListRow, Screen } from '@/components/ui';

// 구매내역 — 별 슬롯 확장 결제 이력. (본문 Figma 스펙 미수령 → mock 데이터, 실제 리스트 디자인/API 오면 교체)
type Purchase = { title: string; date: string; amount: string };

const PURCHASES: Purchase[] = [
  { title: '별 30개 확장', date: '2026.08.15', amount: '₩3,300' },
  { title: '별 10개 확장', date: '2026.07.02', amount: '₩1,100' },
  { title: '별 10개 확장', date: '2026.06.20', amount: '₩1,100' },
];

export default function PurchaseHistoryScreen() {
  if (PURCHASES.length === 0) {
    return (
      <Screen title="구매내역" back>
        <View className="flex-1 items-center justify-center">
          <AppText variant="body" className="text-muted">
            구매내역이 없어요
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="구매내역" back scroll>
      <View className="gap-8 pt-2">
        {PURCHASES.map((item, i) => (
          <ListRow
            key={`${item.title}-${item.date}-${i}`}
            label={item.title}
            subtitle={item.date}
            showChevron={false}
            right={<AppText variant="body">{item.amount}</AppText>}
          />
        ))}
      </View>
    </Screen>
  );
}

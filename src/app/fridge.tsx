import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, SearchBar } from '@/components/ui';

// 재료관리 — 검색 + 카테고리 칩 + 재료 그리드 (Figma). 목업 데이터.
const CATEGORIES = [
  { label: '전체', count: 533 },
  { label: '채소', count: 91 },
  { label: '양념', count: 62 },
  { label: '육류', count: 3 },
  { label: '기타', count: 5 },
];

const ITEMS = [
  { name: '계란', icon: '🥚' },
  { name: '대파', icon: '🌿' },
  { name: '양파', icon: '🧅' },
  { name: '두부', icon: '🧈' },
  { name: '배추', icon: '🥬' },
  { name: '당근', icon: '🥕' },
  { name: '감자', icon: '🥔' },
  { name: '토마토', icon: '🍅' },
  { name: '우유', icon: '🥛' },
  { name: '버섯', icon: '🍄' },
  { name: '마늘', icon: '🧄' },
  { name: '고추', icon: '🌶️' },
  { name: '새우', icon: '🦐' },
  { name: '치즈', icon: '🧀' },
  { name: '옥수수', icon: '🌽' },
];

export default function FridgeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const chipScrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<number, { x: number; w: number }>>({});
  const [active, setActive] = useState(0);

  // 선택한 칩이 가로 스크롤 가운데로 오도록
  const selectChip = (i: number) => {
    setActive(i);
    const l = chipLayouts.current[i];
    if (l)
      chipScrollRef.current?.scrollTo({
        x: Math.max(0, l.x + l.w / 2 - width / 2),
        animated: true,
      });
  };

  return (
    <Screen title="재료 추가하기" close>
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-4 pb-4 pt-2"
        >
          <SearchBar placeholder="재료명을 검색해보세요" />

          {/* 카테고리 칩 — 가로 스크롤, 선택=골드 */}
          <ScrollView
            ref={chipScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {CATEGORIES.map((c, i) => {
              const on = i === active;
              return (
                <Pressable
                  key={c.label}
                  onPress={() => selectChip(i)}
                  onLayout={(e) => {
                    chipLayouts.current[i] = {
                      x: e.nativeEvent.layout.x,
                      w: e.nativeEvent.layout.width,
                    };
                  }}
                  accessibilityRole="button"
                  className={`h-9 items-center justify-center rounded-pill border border-field px-4 active:opacity-80 ${
                    on ? 'bg-primary' : ''
                  }`}
                >
                  <Text
                    className={`text-[14px] leading-[17px] ${on ? 'text-ink' : 'text-foreground'}`}
                  >
                    {c.label} ({c.count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 재료 그리드 — 3열 청킹, 110×83 카드 (bg #34394B, r12) */}
          <View className="gap-4">
            {Array.from({ length: Math.ceil(ITEMS.length / 3) }, (_, r) => (
              <View key={r} className="flex-row gap-4">
                {[0, 1, 2].map((c) => {
                  const item = ITEMS[r * 3 + c];
                  if (!item) return <View key={c} className="flex-1" />;
                  return (
                    <View
                      key={c}
                      className="aspect-[110/83] flex-1 items-center justify-center gap-1 rounded-[12px] bg-popup-button"
                    >
                      <Text className="text-[20px]">{item.icon}</Text>
                      <Text className="text-[16px] font-medium leading-[21px] text-foreground">
                        {item.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="pb-8">
        <Button label="등록하기" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

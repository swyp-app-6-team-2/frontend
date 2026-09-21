import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { type Href } from 'expo-router';

import { palette } from '@/constants/tokens';

export type AddRecipeItem = { icon: number; label: string; href: Href };

// 레시피 등록 3종 — 링크/이미지/연필 아이콘(흰색 PNG, tintColor로 골드 적용).
export const ADD_RECIPE_ITEMS: AddRecipeItem[] = [
  {
    icon: require('../assets/images/ic-link.png'),
    label: 'URL로 등록하기',
    href: '/add-recipe-url',
  },
  {
    icon: require('../assets/images/ic-image.png'),
    label: '이미지로 등록하기',
    href: '/add-recipe-image',
  },
  {
    icon: require('../assets/images/ic-edit.png'),
    label: '직접 등록하기',
    href: '/add-recipe-manual',
  },
];

// FAB 등록 팝오버 카드 (Figma 619:9650) — r20, bg-background.
// 폭 224(Figma 203에서 확장) — "…등록하기" 라벨이 한 줄에 들어가게.
// 각 행: 36×36 아이콘칩(bg-field, r8, 16px 골드 아이콘) + 16px 흰색 라벨.
// highlighted=false: 1px disabled 테두리(기본). highlighted=true: 1px primary
// 테두리 + 흰색 글로우(온보딩 강조).
export function AddRecipeMenu({
  highlighted = false,
  onSelect,
}: {
  highlighted?: boolean;
  onSelect: (item: AddRecipeItem) => void;
}) {
  return (
    <View
      className={`w-[224px] gap-[15px] rounded-[20px] border bg-background p-4 ${
        highlighted ? 'border-primary' : 'border-disabled'
      }`}
      style={
        highlighted
          ? {
              shadowColor: '#FFFFFF',
              shadowOpacity: 0.2,
              shadowRadius: 34,
              shadowOffset: { width: 0, height: 0 },
            }
          : undefined
      }
    >
      {ADD_RECIPE_ITEMS.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => onSelect(item)}
          className="flex-row items-center gap-4 active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <View className="h-9 w-9 items-center justify-center rounded-[8px] bg-field">
            <Image
              source={item.icon}
              style={{ width: 18, height: 18 }}
              tintColor={palette.primary}
              contentFit="contain"
            />
          </View>
          <Text className="text-[16px] leading-[21px] text-foreground">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

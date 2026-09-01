import { type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { palette } from '@/constants/tokens';

type FeatherName = ComponentProps<typeof Feather>['name'];

export type AddRecipeItem = { icon: FeatherName; label: string; href: Href };

// 레시피 등록 3종 — Figma 아이콘명(link/image/edit-3)이 곧 Feather 아이콘.
export const ADD_RECIPE_ITEMS: AddRecipeItem[] = [
  { icon: 'link', label: 'URL로 등록', href: '/add-recipe-url' },
  { icon: 'image', label: '이미지로 등록', href: '/add-recipe-image' },
  { icon: 'edit-3', label: '직접 등록', href: '/add-recipe-manual' },
];

// FAB 등록 팝오버 카드 (Figma 619:9650) — 203×170, r20, bg-background.
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
      className={`w-[203px] gap-[15px] rounded-[20px] border bg-background p-4 ${
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
            <Feather name={item.icon} size={16} color={palette.primary} />
          </View>
          <Text className="text-[16px] leading-[21px] text-foreground">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

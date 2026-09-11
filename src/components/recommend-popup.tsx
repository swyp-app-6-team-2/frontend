import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { RecipeListItem } from '@/lib/api/types';

import { AppText } from './ui';

// 메뉴 추천 결과 팝업 — 이미지(216) + 이름 + 필수재료 + [다시 추천][보기].
// Figma: 딤 #060A19 85%, 카드 #1E2230 radius20, 버튼 150×52 radius30.
export function RecommendPopup({
  recipe,
  onReroll,
  onView,
  onClose,
}: {
  recipe: RecipeListItem;
  onReroll: () => void;
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(150)}
        className="flex-1 items-center justify-center bg-background/85 px-5"
      >
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="닫기" />
        <Animated.View
          entering={FadeIn.duration(180)}
          className="w-full max-w-[362px] overflow-hidden rounded-[20px]"
        >
          {/* 추천 레시피 이미지 */}
          <Image
            source={
              recipe.coverImageUrl
                ? { uri: recipe.coverImageUrl }
                : require('../assets/images/food-sample.png')
            }
            style={{ width: '100%', height: 216 }}
            contentFit="cover"
          />
          {/* 정보 + 버튼 */}
          <View className="items-center gap-[26px] bg-field px-[18px] pb-5 pt-8">
            <View className="items-center gap-3">
              <AppText variant="subheading" className="text-center">
                {recipe.title}
              </AppText>
              <Text className="text-center text-[16px] leading-[21px] text-muted" numberOfLines={2}>
                필수재료: {recipe.ingredientNames.join(', ')}
              </Text>
            </View>
            <View className="w-full flex-row gap-3">
              <Pressable
                onPress={onReroll}
                accessibilityRole="button"
                className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-popup-button active:opacity-80"
              >
                <Text className="text-[16px] font-semibold text-popup-button-text">안 땡겨요</Text>
              </Pressable>
              <Pressable
                onPress={onView}
                accessibilityRole="button"
                className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-primary active:opacity-90"
              >
                <Text className="text-[16px] font-semibold text-ink">좋아!</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

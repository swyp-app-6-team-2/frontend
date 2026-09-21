import { Modal, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';

import { palette } from '@/constants/tokens';
import type { RecipeListItem } from '@/lib/api/types';

import { AppText } from './ui';

// 메뉴 추천 결과 팝업 — 이미지(216) + 이름 + 필수재료 + [안 땡겨요(닫기)][보기].
// Figma: 딤 #060A19 85%, 카드 #1E2230 radius20, 버튼 150×52 radius30.
export function RecommendPopup({
  recipe,
  onView,
  onClose,
}: {
  recipe: RecipeListItem;
  onView: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(260).easing(Easing.out(Easing.quad))}
        className="flex-1 items-center justify-end bg-background/85 px-5 pb-[265px]"
      >
        <Pressable className="absolute inset-0" onPress={onClose} accessibilityLabel="닫기" />
        <Animated.View
          entering={FadeIn.duration(420).easing(Easing.out(Easing.cubic))}
          className="w-full max-w-[362px] overflow-hidden rounded-[20px]"
        >
          {/* 추천 레시피 이미지 — 없으면 중립 플레이스홀더 */}
          {recipe.coverImageUrl ? (
            <Image
              source={{ uri: recipe.coverImageUrl }}
              style={{ width: '100%', height: 216 }}
              contentFit="cover"
            />
          ) : (
            <View
              className="items-center justify-center bg-field"
              style={{ width: '100%', height: 216 }}
            >
              <Feather name="image" size={40} color={palette.disabled} />
            </View>
          )}
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
                onPress={onClose}
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

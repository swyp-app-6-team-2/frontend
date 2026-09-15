import { Fragment, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Screen } from '@/components/ui';
import { RECIPE_CATEGORY_LABEL } from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useCreateCookHistory, useDeleteRecipe, useRecipe } from '@/hooks/use-api';
import { ApiError } from '@/lib/api';

// 21 레시피 상세 — 저장된 레시피 보기. 목록에서 recipeId를 params.id로 넘겨받는다.
export default function RecipeViewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = Number(id);
  const { data, isLoading, isError } = useRecipe(Number.isFinite(recipeId) ? recipeId : null);
  const createCook = useCreateCookHistory(recipeId);
  const deleteRecipe = useDeleteRecipe();
  // 헤더 ⋯ 메뉴(수정/삭제) 팝오버 열림 여부.
  const [menuOpen, setMenuOpen] = useState(false);

  const onEdit = () => {
    setMenuOpen(false);
    router.push({ pathname: '/add-recipe-manual', params: { id: String(recipeId) } });
  };

  const onDelete = () => {
    setMenuOpen(false);
    Alert.alert('레시피 삭제', '이 레시피를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteRecipe.mutate(recipeId, {
            onSuccess: () => router.back(),
            onError: (e) =>
              Alert.alert('삭제 실패', e instanceof ApiError ? e.message : '다시 시도해주세요.'),
          }),
      },
    ]);
  };

  const onComplete = async () => {
    try {
      await createCook.mutateAsync({});
      router.replace({ pathname: '/cook-complete', params: { title: data?.title ?? '' } });
    } catch (e) {
      Alert.alert('기록 실패', e instanceof ApiError ? e.message : '다시 시도해주세요.');
    }
  };

  if (isLoading) {
    return (
      <Screen title="" back>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen title="" back>
        <View className="flex-1 items-center justify-center">
          <AppText variant="body" className="text-muted">
            레시피를 불러오지 못했어요.
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      title=""
      back
      headerRight={
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="더보기"
        >
          <Feather name="more-horizontal" size={24} color={palette.foreground} />
        </Pressable>
      }
    >
      <View className="flex-1">
        <ScrollView contentContainerClassName="pb-4" showsVerticalScrollIndicator={false}>
          {/* 대표 이미지 362x362 */}
          <Image
            source={
              data.coverImageUrl
                ? { uri: data.coverImageUrl }
                : require('../assets/images/food-sample.png')
            }
            style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
            contentFit="cover"
          />

          {/* 카테고리 칩 */}
          <View className="mt-6 self-start rounded-[4px] bg-field px-3 py-1">
            <Text className="text-[14px] leading-[17px] text-muted">
              {RECIPE_CATEGORY_LABEL[data.categoryCode]}
            </Text>
          </View>

          {/* 제목 */}
          <Text className="mt-3 text-[24px] font-bold leading-[29px] text-foreground">
            {data.title}
          </Text>

          {/* 인분 / 시간 */}
          <View className="mt-3 flex-row items-center gap-4">
            <View className="flex-row items-center gap-2">
              <Feather name="user" size={22} color={palette.muted} />
              <Text className="text-[16px] leading-[19px] text-foreground">
                {data.servings}인분
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Feather name="clock" size={22} color={palette.muted} />
              <Text className="text-[16px] leading-[19px] text-foreground">
                {data.cookTimeMinutes != null ? `${data.cookTimeMinutes}분` : '-'}
              </Text>
            </View>
          </View>

          {/* 재료 카드 — 이름/수량 행 + 구분선 */}
          {data.ingredients.length > 0 ? (
            <View className="mt-7 gap-4 rounded-[12px] bg-field px-4 py-5">
              {data.ingredients.map((ing, i) => (
                <Fragment key={`${ing.name}-${i}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[16px] font-medium leading-[21px] text-foreground">
                      {ing.name}
                    </Text>
                    <Text className="text-[16px] font-medium leading-[21px] text-muted">
                      {ing.amountText ?? ''}
                    </Text>
                  </View>
                  {i < data.ingredients.length - 1 ? <View className="h-px bg-disabled" /> : null}
                </Fragment>
              ))}
            </View>
          ) : null}

          {/* 레시피(조리 순서) */}
          {data.steps.length > 0 ? (
            <>
              <AppText variant="body" className="mt-9 font-normal">
                레시피
              </AppText>
              <View className="mt-4 gap-6">
                {data.steps.map((step, i) => (
                  <View key={`${i}-${step.content}`} className="flex-row items-start gap-4">
                    <View
                      className="h-5 w-5 items-center justify-center rounded-full bg-surface"
                      style={{ borderWidth: 1, borderColor: palette.primary }}
                    >
                      <Text className="text-[14px] leading-[18px] text-primary">{i + 1}</Text>
                    </View>
                    <Text className="flex-1 text-[16px] leading-[21px] text-foreground">
                      {step.content}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* 메모 */}
          {data.memo ? (
            <>
              <AppText variant="body" className="mt-9 font-normal">
                메모
              </AppText>
              <Text className="mt-4 text-[16px] leading-[21px] text-muted">{data.memo}</Text>
            </>
          ) : null}
        </ScrollView>
      </View>

      {/* 하단 고정 — 요리 완료 기록(별 점등) */}
      <View className="pb-8 pt-4">
        <Button label="완료하기" onPress={onComplete} disabled={createCook.isPending} />
      </View>

      {/* 헤더 ⋯ 메뉴 — 헤더 우측 아래 앵커. 바깥 탭하면 닫힘. */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setMenuOpen(false)}
          accessibilityLabel="메뉴 닫기"
        >
          <View
            className="absolute right-5 w-[159px] gap-[15px] rounded-[12px] border border-disabled bg-background p-4"
            style={{
              top: insets.top + 72 + 6,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
          >
            <Pressable
              onPress={onEdit}
              className="flex-row items-center gap-4 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="수정하기"
            >
              <View className="h-9 w-9 items-center justify-center rounded-[8px] bg-field">
                <Feather name="edit-2" size={24} color={palette.primary} />
              </View>
              <AppText variant="body" className="font-normal">
                수정하기
              </AppText>
            </Pressable>
            <Pressable
              onPress={onDelete}
              className="flex-row items-center gap-4 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="삭제하기"
            >
              <View className="h-9 w-9 items-center justify-center rounded-[8px] bg-field">
                <Feather name="trash-2" size={24} color={palette.primary} />
              </View>
              <AppText variant="body" className="font-normal">
                삭제하기
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

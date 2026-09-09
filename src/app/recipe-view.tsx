import { Fragment } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText, Button, Screen } from '@/components/ui';
import { RECIPE_CATEGORY_LABEL } from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useCreateCookHistory, useDeleteRecipe, useRecipe } from '@/hooks/use-api';
import { ApiError } from '@/lib/api';

// 21 레시피 상세 — 저장된 레시피 보기. 목록에서 recipeId를 params.id로 넘겨받는다.
export default function RecipeViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = Number(id);
  const { data, isLoading, isError } = useRecipe(Number.isFinite(recipeId) ? recipeId : null);
  const createCook = useCreateCookHistory(recipeId);
  const deleteRecipe = useDeleteRecipe();

  const onDelete = () => {
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
          onPress={onDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="삭제"
        >
          <Feather name="trash-2" size={22} color={palette.muted} />
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
    </Screen>
  );
}

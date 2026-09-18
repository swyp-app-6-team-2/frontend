import { Fragment, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppRefreshControl, AppText, Button, Screen } from '@/components/ui';
import { RECIPE_CATEGORY_LABEL } from '@/constants/labels';
import { palette } from '@/constants/tokens';
import {
  useCookHistories,
  useCreateCookHistory,
  useDeleteRecipe,
  useRecipe,
} from '@/hooks/use-api';
import { useRefresh } from '@/hooks/use-refresh';
import { ApiError } from '@/lib/api';

// 요리 기록 날짜 표기 — 서버는 UTC ISO만 주고 로컬 포맷·상대시간은 클라가 계산(api-spec).
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

function formatCookedDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY[d.getDay()]})`;
}

// "방금 / N시간 전 / N일 전 / N주 전 / N개월 전" — 주·월은 반올림(예: 13일→2주 전).
function formatRelative(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  if (diff < hour) return '방금';
  if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
  if (diff < week) return `${Math.floor(diff / day)}일 전`;
  if (diff < month) return `${Math.round(diff / week)}주 전`;
  return `${Math.round(diff / month)}개월 전`;
}

// 21 레시피 상세 — 저장된 레시피 보기. 목록에서 recipeId를 params.id로 넘겨받는다.
export default function RecipeViewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = Number(id);
  const { data, isLoading, isError } = useRecipe(Number.isFinite(recipeId) ? recipeId : null);
  const { data: cookData } = useCookHistories(Number.isFinite(recipeId) ? recipeId : null);
  const refresh = useRefresh();
  const cookHistories = cookData ?? [];
  const createCook = useCreateCookHistory(recipeId);
  const deleteRecipe = useDeleteRecipe();
  // 헤더 ⋯ 메뉴(수정/삭제) 팝오버 열림 여부.
  const [menuOpen, setMenuOpen] = useState(false);
  // 요리 완료 기록 성공 → 완료 축하 팝업 표시 여부.
  const [showComplete, setShowComplete] = useState(false);

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
      setShowComplete(true); // 기록 성공 → 완료 축하 팝업. 확인 시 별 점등 화면으로.
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

  // 원본 링크(URL 분석 레시피만 존재). 클로저에서 좁혀진 값 유지.
  const originalUrl = data.source?.originalUrl ?? null;
  // 대표 이미지 = 직접 올린 커버 우선, 없으면 분석 원본 대표 이미지(thumbnail).
  const coverUrl = data.coverImageUrl ?? data.source?.thumbnailUrl ?? null;

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
        <ScrollView
          contentContainerClassName="pb-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<AppRefreshControl {...refresh} />}
        >
          {/* 대표 이미지 362x362 — 없으면 중립 플레이스홀더(샘플 사진 대신) */}
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', aspectRatio: 1, borderRadius: 12 }}
              contentFit="cover"
            />
          ) : (
            <View
              className="w-full items-center justify-center rounded-[12px] bg-field"
              style={{ aspectRatio: 1 }}
            >
              <Feather name="image" size={48} color={palette.disabled} />
            </View>
          )}

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
            {/* 원본 보기 — 분석(URL) 레시피의 출처 열기. originalUrl 있을 때만 노출. */}
            {originalUrl ? (
              <Pressable
                className="flex-row items-center gap-2 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="원본 보기"
                onPress={() => Linking.openURL(originalUrl)}
              >
                <Feather name="share" size={22} color={palette.muted} />
                <Text className="text-[16px] leading-[19px] text-foreground">원본 보기</Text>
              </Pressable>
            ) : null}
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
              <View className="mt-4 gap-3">
                {data.steps.map((step, i) => (
                  <Fragment key={`${i}-${step.content}`}>
                    <View className="flex-row items-start gap-4">
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
                    {/* 단계 사이 연결 점 — 번호 칩 열(20px)에 정렬한 세로 2점 커넥터. */}
                    {i < data.steps.length - 1 ? (
                      <View className="w-5 items-center gap-1">
                        <View className="h-1 w-1 rounded-full bg-disabled" />
                        <View className="h-1 w-1 rounded-full bg-disabled" />
                      </View>
                    ) : null}
                  </Fragment>
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

          {/* 요리 기록 — 지금까지 총 N회 완료. 날짜 + 상대시간, 최근 3개월만 표시. */}
          {cookHistories.length > 0 ? (
            <View className="mt-9">
              <Text className="text-[16px] leading-[21px] text-foreground">
                지금까지 총 {cookHistories.length}회 완료했어요
              </Text>
              <View className="mt-5">
                {cookHistories.map((h, i) => (
                  <Fragment key={`${h.cookedAt}-${i}`}>
                    {i > 0 ? <View className="my-5 h-px bg-disabled" /> : null}
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[14px] leading-[18px] text-muted">
                        {formatCookedDate(h.cookedAt)}
                      </Text>
                      <Text className="text-[14px] leading-[18px] text-muted">
                        {formatRelative(h.cookedAt)}
                      </Text>
                    </View>
                  </Fragment>
                ))}
              </View>
              <Text className="mt-5 text-center text-[14px] font-medium leading-[18px] text-body-muted">
                최근 3개월의 요리 기록만 표시돼요
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>

      {/* 하단 고정 — 요리 완료 기록(별 점등) */}
      <View className="pb-8 pt-4">
        <Button label="요리 완료" onPress={onComplete} disabled={createCook.isPending} />
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
              top: insets.top + 56,
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

      {/* 요리 완료 축하 팝업 — Figma: dim(background@85%) + 중앙 카드(마스코트 상단 겹침) + 골드 확인 버튼.
          전체화면 확보 위해 명시적 window 크기 View에 인라인 스타일로 구현. */}
      <Modal visible={showComplete} transparent statusBarTranslucent animationType="fade">
        <View
          style={{
            width: winW,
            height: winH,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 10,
            backgroundColor: 'rgba(6,10,25,0.85)', // background(#060A19) 85% dim
          }}
        >
          <View style={{ width: '100%', maxWidth: 362, alignItems: 'center' }}>
            {/* 마스코트 — 카드 상단에 걸쳐 얹힘 */}
            <Image
              source={require('../assets/images/mascot-cook-complete.png')}
              style={{ width: 166, height: 143, marginBottom: -44, zIndex: 2 }}
              contentFit="contain"
            />
            {/* 카드 */}
            <View
              style={{
                width: '100%',
                alignItems: 'center',
                gap: 26,
                paddingTop: 48,
                paddingHorizontal: 18,
                paddingBottom: 20,
                borderRadius: 20,
                backgroundColor: palette.field,
                shadowColor: '#000',
                shadowOpacity: 0.35,
                shadowRadius: 40,
                shadowOffset: { width: 0, height: 20 },
                elevation: 12,
              }}
            >
              <View style={{ alignItems: 'center', gap: 12 }}>
                <Text
                  style={{
                    fontSize: 22,
                    lineHeight: 29,
                    fontWeight: '700',
                    color: palette.foreground,
                    textAlign: 'center',
                  }}
                >
                  요리를 완료하였어요!
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    lineHeight: 21,
                    fontWeight: '500',
                    color: palette.bodyMuted,
                    textAlign: 'center',
                  }}
                >
                  {'맛있는 한 끼 완성!\n오늘의 요리가 기록됐어요'}
                </Text>
              </View>
              <Pressable
                onPress={() => router.replace('/home')}
                accessibilityRole="button"
                style={{
                  height: 52,
                  alignSelf: 'stretch',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 30,
                  backgroundColor: palette.primary,
                }}
              >
                <Text
                  style={{ fontSize: 16, lineHeight: 21, fontWeight: '600', color: palette.ink }}
                >
                  확인
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

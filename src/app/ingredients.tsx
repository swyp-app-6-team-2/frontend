import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBar } from '@/components/tab-bar';
import {
  AlertDialog,
  AppRefreshControl,
  AppText,
  PressableScale,
  SearchBar,
} from '@/components/ui';
import {
  CUSTOM_INGREDIENT_EMOJI,
  CUSTOM_INGREDIENT_LABEL,
  INGREDIENT_CATEGORY_EMOJI,
  INGREDIENT_CATEGORY_LABEL,
  INGREDIENT_CATEGORY_ORDER,
  ingredientCategoryEmoji,
} from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useDeleteMyIngredients, useMyIngredients } from '@/hooks/use-api';
import { useRefresh } from '@/hooks/use-refresh';
import { ApiError } from '@/lib/api';
import type { UserIngredient } from '@/lib/api/types';

// 재료 식별 키(선택 상태·삭제 대상 매핑) — 마스터/커스텀이 다른 id 필드를 쓰므로 통합.
function itemKey(it: UserIngredient): string {
  return `${it.ingredientType}:${it.ingredientType === 'MASTER' ? it.ingredientId : it.customIngredientId}`;
}
function itemId(it: UserIngredient): number {
  return (it.ingredientType === 'MASTER' ? it.ingredientId : it.customIngredientId) as number;
}

// Figma 칩 — 이모지/아이콘 + 이름. 선택 모드: 탭 토글, 선택 시 골드 테두리+체크+골드 텍스트.
// (평소·미선택 모두 투명 테두리를 둬 선택 토글 시 크기 변화(CLS)가 없게 한다.)
function IngredientChip({
  ing,
  selectMode,
  selected,
  onToggle,
}: {
  ing: UserIngredient;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const cls = `h-9 flex-row items-center gap-1.5 rounded-pill border px-4 ${
    selected ? 'border-primary bg-star-chip' : 'border-transparent bg-field'
  }`;
  const content = (
    <>
      {selected ? (
        <Feather name="check" size={16} color={palette.primary} />
      ) : ing.iconUrl ? (
        <Image
          source={{ uri: ing.iconUrl }}
          style={{ width: 18, height: 18 }}
          contentFit="contain"
          transition={150}
        />
      ) : (
        <Text className="text-[14px]">{ingredientCategoryEmoji(ing.categoryCode)}</Text>
      )}
      <Text
        className={`text-[14px] leading-[17px] ${selected ? 'text-primary' : 'text-foreground'}`}
      >
        {ing.name}
      </Text>
    </>
  );
  if (!selectMode) return <View className={cls}>{content}</View>;
  return (
    <PressableScale
      onPress={onToggle}
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cls}
    >
      {content}
    </PressableScale>
  );
}

// 더보기 메뉴 한 줄 — 36 아이콘 박스(골드) + 라벨.
function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityRole="button"
      className="h-9 flex-row items-center gap-3"
    >
      <View className="h-9 w-9 items-center justify-center rounded-[8px] bg-field">
        <Feather name={icon} size={16} color={palette.primary} />
      </View>
      <Text className="text-[16px] leading-[21px] text-foreground">{label}</Text>
    </PressableScale>
  );
}

// 선택 삭제 안내 배너 — 에러가 아니라, 선택 모드 동안 상단에 상시 떠 있는 안내.
function SelectBanner() {
  return (
    <View className="h-12 flex-row items-center gap-2.5 rounded-pill border border-error bg-error/15 px-4">
      <Feather name="alert-circle" size={24} color={palette.error} />
      <Text className="text-[14px] font-medium leading-[18px] text-foreground">
        삭제할 재료를 선택해주세요
      </Text>
    </View>
  );
}

// 재료관리 — 카테고리별 섹션 + 재료 칩. 더보기(⋯) → 전체/선택 삭제. + FAB → 재료 추가하기.
export default function IngredientsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<'SELECTED' | 'ALL' | null>(null);
  const del = useDeleteMyIngredients();

  // 내가 등록한 재료만. 마스터 전체가 아니라 GET /users/me/ingredients.
  const { data, isLoading, isError } = useMyIngredients();
  const items = useMemo(() => data?.ingredients ?? [], [data]);

  // 카테고리 순서대로, 항목 있는 섹션만. 검색어는 이름으로 필터(보유 응답엔 별칭 없음).
  const sections = useMemo(
    () =>
      INGREDIENT_CATEGORY_ORDER.map((cat) => ({
        cat,
        items: items.filter(
          (it) => it.categoryCode === cat && (!query || it.name.toLowerCase().includes(query)),
        ),
      })).filter((s) => s.items.length > 0),
    [items, query],
  );
  // 커스텀(직접 입력) 재료는 카테고리가 없어 카테고리 섹션에 안 잡힌다 → 맨 아래 별도 섹션.
  const customItems = useMemo(
    () =>
      items.filter(
        (it) => it.ingredientType === 'CUSTOM' && (!query || it.name.toLowerCase().includes(query)),
      ),
    [items, query],
  );
  const hasAny = sections.length > 0 || customItems.length > 0;
  const refresh = useRefresh();

  const toggle = (k: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const exitSelect = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  // 헤더 삭제 아이콘 — 선택된 게 있을 때만 확인 팝업(0개면 안내 배너가 이미 떠 있음).
  const onHeaderDelete = () => {
    if (selected.size === 0) return;
    setConfirm('SELECTED');
  };

  const doDelete = () => {
    if (!confirm || del.isPending) return;
    const mode = confirm;
    const ingredients =
      mode === 'ALL'
        ? []
        : items
            .filter((it) => selected.has(itemKey(it)))
            .map((it) => ({ type: it.ingredientType, id: itemId(it) }));
    del.mutate(
      { mode, ingredients },
      {
        onSuccess: () => {
          setConfirm(null);
          exitSelect();
        },
        onError: (e) =>
          Alert.alert(
            '삭제 실패',
            e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.',
          ),
      },
    );
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerClassName={`gap-6 px-screen pb-[120px] ${Platform.OS === 'android' ? 'pt-7' : 'pt-2'}`}
          showsVerticalScrollIndicator={false}
          refreshControl={<AppRefreshControl {...refresh} />}
        >
          {/* 제목~검색바 간격은 나의 레시피(gap-4)와 통일 */}
          <View className="gap-4">
            <View className="h-[26px] flex-row items-center justify-between">
              {selectMode ? (
                <PressableScale
                  onPress={exitSelect}
                  haptic="light"
                  accessibilityRole="button"
                  accessibilityLabel="선택 취소"
                  className="h-6 w-6 items-center justify-center"
                >
                  <Feather name="arrow-left" size={24} color={palette.foreground} />
                </PressableScale>
              ) : (
                <AppText variant="title">재료관리</AppText>
              )}
              {selectMode ? (
                <PressableScale
                  onPress={onHeaderDelete}
                  haptic="light"
                  accessibilityRole="button"
                  accessibilityLabel="선택 삭제"
                  className="h-6 w-6 items-center justify-center"
                >
                  <Image
                    source={require('../assets/images/ic-delete.png')}
                    style={{ width: 24, height: 24 }}
                    contentFit="contain"
                  />
                </PressableScale>
              ) : hasAny ? (
                <PressableScale
                  onPress={() => setMenuOpen(true)}
                  haptic="light"
                  accessibilityRole="button"
                  accessibilityLabel="더보기"
                  className="h-6 w-6 items-center justify-center"
                >
                  <Feather name="more-horizontal" size={24} color={palette.foreground} />
                </PressableScale>
              ) : null}
            </View>
            <SearchBar
              placeholder="재료명을 검색해보세요"
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
            />
            {selectMode ? <SelectBanner /> : null}
          </View>

          {isLoading ? (
            <View className="items-center py-20">
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : isError ? (
            <View className="items-center py-20">
              <AppText variant="body" className="text-muted">
                재료를 불러오지 못했어요.
              </AppText>
            </View>
          ) : !hasAny ? (
            <View className="items-center py-20">
              <AppText variant="body" className="text-muted">
                {query ? '검색 결과가 없어요.' : '아직 재료가 없어요.'}
              </AppText>
            </View>
          ) : (
            <>
              {sections.map((s) => (
                <View key={s.cat} className="gap-3">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[16px]">{INGREDIENT_CATEGORY_EMOJI[s.cat]}</Text>
                    <AppText variant="body" className="font-medium text-foreground">
                      {INGREDIENT_CATEGORY_LABEL[s.cat]}
                    </AppText>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {s.items.map((ing) => {
                      const k = itemKey(ing);
                      return (
                        <IngredientChip
                          key={`m${ing.ingredientId}`}
                          ing={ing}
                          selectMode={selectMode}
                          selected={selected.has(k)}
                          onToggle={() => toggle(k)}
                        />
                      );
                    })}
                  </View>
                </View>
              ))}
              {customItems.length > 0 ? (
                <View className="gap-3">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[16px]">{CUSTOM_INGREDIENT_EMOJI}</Text>
                    <AppText variant="body" className="font-medium text-foreground">
                      {CUSTOM_INGREDIENT_LABEL}
                    </AppText>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    {customItems.map((ing) => {
                      const k = itemKey(ing);
                      return (
                        <IngredientChip
                          key={`c${ing.customIngredientId}`}
                          ing={ing}
                          selectMode={selectMode}
                          selected={selected.has(k)}
                          onToggle={() => toggle(k)}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <TabBar active="fridge" />
      </SafeAreaView>

      {/* 재료 추가 FAB — 선택 모드에선 숨김(삭제는 헤더 아이콘으로) */}
      {!selectMode ? (
        <View
          className="absolute right-5 items-end"
          style={{ bottom: insets.bottom + 90 }}
          pointerEvents="box-none"
        >
          <PressableScale
            onPress={() => router.push('/fridge')}
            haptic="light"
            className="h-14 w-14 items-center justify-center rounded-full bg-primary"
            style={{
              shadowColor: '#000000',
              shadowOpacity: 0.35,
              shadowRadius: 40,
              shadowOffset: { width: 0, height: 20 },
              elevation: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="재료 추가하기"
          >
            <Feather name="plus" size={24} color={palette.ink} />
          </PressableScale>
        </View>
      ) : null}

      {/* 더보기 메뉴 — 전체/선택 삭제 */}
      {menuOpen ? (
        <Modal
          transparent
          visible
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="닫기"
          />
          <View
            className="absolute gap-2 rounded-[20px] border border-disabled bg-background p-4"
            style={{ top: insets.top + 52, right: 20, width: 160 }}
          >
            <MenuRow
              icon="trash-2"
              label="전체 삭제"
              onPress={() => {
                setMenuOpen(false);
                setConfirm('ALL');
              }}
            />
            <MenuRow
              icon="check-square"
              label="선택 삭제"
              onPress={() => {
                setMenuOpen(false);
                setSelected(new Set());
                setSelectMode(true);
              }}
            />
          </View>
        </Modal>
      ) : null}

      {/* 삭제 확인 팝업 */}
      {confirm !== null ? (
        <Modal
          transparent
          visible
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setConfirm(null)}
        >
          <AlertDialog
            icon={<Feather name="trash-2" size={24} color={palette.error} />}
            title="삭제하시겠습니까?"
            message={
              confirm === 'ALL'
                ? '보유한 모든 재료가 삭제되며\n복구할 수 없어요'
                : `선택한 재료 ${selected.size}개가 삭제되며\n복구할 수 없어요`
            }
            actions={[
              { label: '취소', tone: 'neutral', onPress: () => setConfirm(null) },
              { label: '삭제', tone: 'danger', onPress: doDelete },
            ]}
          />
        </Modal>
      ) : null}
    </View>
  );
}

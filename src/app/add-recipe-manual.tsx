import { useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View, type ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';
import { RECIPE_CATEGORY_LABEL, RECIPE_CATEGORY_ORDER } from '@/constants/labels';
import { palette } from '@/constants/tokens';
import { useCreateRecipe } from '@/hooks/use-api';
import { ApiError, uploadImage } from '@/lib/api';
import type { RecipeCategory } from '@/lib/api/types';
import { ImagePickerUnavailableError, pickSquareImage, type PickedImage } from '@/lib/pick-image';

// 냉장고에 있는 재료 추천 (탭하면 재료 행에 추가)
const OWNED = ['브로콜리', '새우', '대파', '계란', '다진 마늘', '설탕', '소금', '후추'];

// 조리시간 프리셋 (분) — 단일 선택
const COOK_TIMES = [
  { label: '1분', value: 1 },
  { label: '5분', value: 5 },
  { label: '10분', value: 10 },
  { label: '30분', value: 30 },
  { label: '1시간', value: 60 },
];

type Ingredient = { name: string; qty: string };

// 점선 추가 버튼 (재료 추가 / 단계 추가 공용)
function DashedAddButton({
  label,
  onPress,
  className,
}: {
  label: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`h-[52px] flex-row items-center justify-center gap-1 rounded-[30px] border border-dashed border-muted bg-field active:opacity-80 ${
        className ?? ''
      }`}
    >
      <Feather name="plus" size={24} color={palette.muted} />
      <Text className="text-[16px] text-muted">{label}</Text>
    </Pressable>
  );
}

// 18 레시피 직접 입력 — 사진·이름·카테고리·재료·방법 (Figma 619:9650).
export default function AddRecipeManualScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const create = useCreateRecipe();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('KOREAN');
  const [cookHour, setCookHour] = useState(''); // 조리시간 — 시
  const [cookMin, setCookMin] = useState(''); // 조리시간 — 분
  const [servings, setServings] = useState('');
  const cookMinutes = (Number(cookHour) || 0) * 60 + (Number(cookMin) || 0);
  // 프리셋 칩 → 현재 조리시간에 누적으로 더한다
  const addCookPreset = (mins: number) => {
    const total = cookMinutes + mins;
    const h = Math.floor(total / 60);
    const m = total % 60;
    setCookHour(h ? String(h) : '');
    setCookMin(m ? String(m) : '');
  };
  const resetCookTime = () => {
    setCookHour('');
    setCookMin('');
  };
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', qty: '' }]);
  const [steps, setSteps] = useState<string[]>(['']);
  const [cover, setCover] = useState<PickedImage | null>(null);
  const [uploading, setUploading] = useState(false);

  // 대표 사진 선택 — 네이티브 모듈 없으면(리빌드 전) 안내 후 무시.
  const onPickCover = async () => {
    try {
      const picked = await pickSquareImage();
      if (picked) setCover(picked);
    } catch (e) {
      if (e instanceof ImagePickerUnavailableError) {
        Alert.alert('사진 기능 준비 중', '앱을 다시 빌드하면 사진 추가를 사용할 수 있어요.');
        return;
      }
      Alert.alert('오류', '사진을 불러오지 못했어요.');
    }
  };

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('알림', '레시피명을 입력해주세요.');
      return;
    }

    // 대표 사진이 있으면 먼저 업로드해 objectKey를 얻는다. 실패 시 사진 없이 저장할지 확인.
    let coverImageKey: string | undefined;
    if (cover) {
      setUploading(true);
      try {
        coverImageKey = await uploadImage('RECIPE_COVER', cover);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : '사진을 업로드하지 못했어요.';
        const proceed = await new Promise<boolean>((resolve) =>
          Alert.alert('사진 업로드 실패', `${msg}\n사진 없이 저장할까요?`, [
            { text: '취소', style: 'cancel', onPress: () => resolve(false) },
            { text: '사진 없이 저장', onPress: () => resolve(true) },
          ]),
        );
        if (!proceed) {
          setUploading(false);
          return;
        }
      } finally {
        setUploading(false);
      }
    }

    try {
      const res = await create.mutateAsync({
        title: title.trim(),
        categoryCode: category,
        cookTimeMinutes: cookMinutes > 0 ? cookMinutes : undefined,
        coverImageKey,
        servings: servings ? Number(servings) : undefined,
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({ name: i.name.trim(), amountText: i.qty.trim() || undefined })),
        steps: steps.filter((s) => s.trim()).map((s) => ({ content: s.trim() })),
      });
      router.replace({ pathname: '/recipe-view', params: { id: String(res.recipeId) } });
    } catch (e) {
      Alert.alert('저장 실패', e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.');
    }
  };

  const setIngredient = (i: number, key: keyof Ingredient, val: string) =>
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [key]: val } : ing)));
  const addIngredient = (name = '') => setIngredients((prev) => [...prev, { name, qty: '' }]);
  const removeIngredient = (i: number) =>
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const setStep = (i: number, val: string) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? val : s)));
  const addStep = () => {
    setSteps((prev) => [...prev, '']);
    // 새 단계가 레이아웃된 다음 프레임에 맨 아래로 스무스 스크롤
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };
  const removeStep = (i: number) =>
    setSteps((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  const moveStepUp = (i: number) =>
    setSteps((prev) => {
      if (i === 0) return prev;
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });

  return (
    <Screen
      title="레시피 직접 입력"
      close
      onClose={() => router.replace('/home')}
      scroll
      scrollRef={scrollRef}
    >
      {/* 대표 사진 추가 (선택) — 정사각 field 박스. 선택하면 미리보기, 없으면 카메라+안내 */}
      <Pressable
        onPress={onPickCover}
        className="aspect-square w-full items-center justify-center overflow-hidden rounded-[12px] bg-field active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={cover ? '대표 사진 변경' : '대표 사진 추가'}
      >
        {cover ? (
          <Image
            source={{ uri: cover.uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-row items-center gap-[10px]">
            <Image
              source={require('../assets/images/ic-camera.png')}
              style={{ width: 24, height: 24 }}
              tintColor={palette.muted}
              contentFit="contain"
            />
            <AppText variant="body" className="font-normal text-muted">
              대표 사진 추가 (선택)
            </AppText>
          </View>
        )}
      </Pressable>

      {/* 이름 — Frame 298 라벨행(padding 8/16/8/8, gap0→input) · 위 마진 20 = screen gap16 + mt-1 */}
      <View className="mt-1">
        <View className="flex-row items-center gap-[10px] py-2 pl-2 pr-4">
          <AppText variant="body" className="text-foreground">
            레시피명
          </AppText>
        </View>
        <SearchBar placeholder="예)김치찜" leftIcon={null} value={title} onChangeText={setTitle} />
      </View>

      {/* 카테고리 — 선택 칩(골드)·나머지 outline · 위 마진 24 = screen gap16 + mt-2 */}
      <View className="mt-2 gap-2">
        <AppText variant="body" className="text-foreground">
          카테고리
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          {RECIPE_CATEGORY_ORDER.map((code) => {
            const on = code === category;
            return (
              <Pressable
                key={code}
                onPress={() => setCategory(code)}
                accessibilityRole="button"
                className={`h-9 items-center justify-center rounded-pill border border-field px-4 active:opacity-80 ${
                  on ? 'bg-primary' : ''
                }`}
              >
                <Text
                  className={`text-[14px] leading-[17px] ${on ? 'text-surface' : 'text-foreground'}`}
                >
                  {RECIPE_CATEGORY_LABEL[code]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 조리시간 — 시/분 직접 입력 2칸 + 프리셋 칩 + 초기화 · 위 마진 24 = screen gap16 + mt-2 */}
      <View className="mt-2 gap-2">
        <View className="flex-row items-center justify-between py-2 pl-2 pr-4">
          <AppText variant="body" className="text-foreground">
            조리시간
          </AppText>
          <Pressable
            onPress={resetCookTime}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="조리시간 초기화"
            className="flex-row items-center gap-1 active:opacity-80"
          >
            <Feather name="rotate-ccw" size={16} color={palette.muted} />
            <Text className="text-[14px] leading-[17px] text-muted">초기화</Text>
          </Pressable>
        </View>

        {/* 시간/분 직접 입력 (Figma: 173×44 pill 2칸) — 우측정렬 숫자 + 접미사 */}
        <View className="flex-row gap-2">
          <View className="h-11 flex-1 flex-row items-center gap-[10px] rounded-pill bg-field px-4">
            <TextInput
              className="flex-1 text-foreground"
              style={{ fontSize: 16, lineHeight: 21, textAlign: 'right' }}
              placeholder="0"
              placeholderTextColor={palette.muted}
              keyboardType="number-pad"
              value={cookHour}
              onChangeText={(t) => setCookHour(t.replace(/[^0-9]/g, ''))}
            />
            <AppText variant="body" className="font-normal text-foreground">
              시간
            </AppText>
          </View>
          <View className="h-11 flex-1 flex-row items-center gap-[10px] rounded-pill bg-field px-4">
            <TextInput
              className="flex-1 text-foreground"
              style={{ fontSize: 16, lineHeight: 21, textAlign: 'right' }}
              placeholder="0"
              placeholderTextColor={palette.muted}
              keyboardType="number-pad"
              value={cookMin}
              onChangeText={(t) => setCookMin(t.replace(/[^0-9]/g, ''))}
            />
            <AppText variant="body" className="font-normal text-foreground">
              분
            </AppText>
          </View>
        </View>

        {/* 빠른 선택 — 탭할 때마다 조리시간에 누적으로 더한다 */}
        <View className="flex-row flex-wrap gap-2">
          {COOK_TIMES.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => addCookPreset(t.value)}
              accessibilityRole="button"
              accessibilityLabel={`조리시간 ${t.label} 추가`}
              className="h-9 items-center justify-center rounded-pill border border-field px-4 active:opacity-80"
            >
              <Text className="text-[12px] leading-[14px] text-foreground">+{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 제공량 — Frame 298 라벨행(padding 8/16/8/8, gap0→input) · 우측정렬 흰색 입력 · 위 마진 24 = screen gap16 + mt-2 */}
      <View className="mt-2">
        <View className="flex-row items-center gap-[10px] py-2 pl-2 pr-4">
          <AppText variant="body" className="text-foreground">
            제공량
          </AppText>
        </View>
        {/* 우측정렬 숫자 입력 + 고정 접미사 '인분' (input: h44·px16·gap10·bg field·pill) */}
        <View className="h-11 flex-row items-center gap-[10px] rounded-pill bg-field px-4">
          <TextInput
            className="flex-1 text-foreground"
            style={{ fontSize: 16, lineHeight: 21, textAlign: 'right' }}
            placeholder="0"
            placeholderTextColor={palette.muted}
            keyboardType="number-pad"
            value={servings}
            onChangeText={(t) => setServings(t.replace(/[^0-9]/g, ''))}
          />
          <AppText variant="body" className="font-normal text-foreground">
            인분
          </AppText>
        </View>
      </View>

      {/* 재료 — 재료명/수량 입력 행 + 삭제, 보유 재료 추천, 재료 추가 · 위 마진 24 = screen gap16 + mt-2 */}
      <View className="mt-2 gap-2">
        <AppText variant="body" className="text-foreground">
          재료
        </AppText>
        {ingredients.map((ing, i) => (
          <View key={i} className="flex-row items-center gap-2">
            <SearchBar
              leftIcon={null}
              placeholder="재료명"
              containerClassName="flex-1"
              value={ing.name}
              onChangeText={(t) => setIngredient(i, 'name', t)}
            />
            <SearchBar
              leftIcon={null}
              placeholder="수량"
              containerClassName="h-11 w-[122px]"
              value={ing.qty}
              onChangeText={(t) => setIngredient(i, 'qty', t)}
            />
            <Pressable
              onPress={() => removeIngredient(i)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="재료 삭제"
            >
              <Image
                source={require('../assets/images/ic-trash.png')}
                style={{ width: 24, height: 24 }}
                tintColor={palette.muted}
                contentFit="contain"
              />
            </Pressable>
          </View>
        ))}

        {/* 위 12 = gap8+mt-1, 아래 16 = gap8+mb-2 */}
        <DashedAddButton label="재료 추가" onPress={() => addIngredient()} className="mb-2 mt-1" />

        {/* 갖고 있는 재료 — 탭하면 재료 행 추가 */}
        <View className="gap-[10px] rounded-[12px] bg-field p-3">
          <View className="flex-row items-center gap-1.5">
            <Feather name="bookmark" size={16} color={palette.primary} />
            <Text className="text-[14px] text-primary">갖고 있는 재료</Text>
          </View>
          <View className="flex-row flex-wrap gap-1.5">
            {OWNED.map((o) => {
              const added = ingredients.some((ing) => ing.name === o);
              return (
                <Pressable
                  key={o}
                  onPress={() => addIngredient(o)}
                  disabled={added}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: added }}
                  className={`rounded-pill border border-primary/50 bg-primary/10 px-3 py-1.5 ${
                    added ? 'opacity-40' : 'active:opacity-80'
                  }`}
                >
                  <Text className="text-[12px] leading-[14px] text-primary">{o}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* 방법 — 번호+순서이동 단계 입력 + 삭제, 단계 추가 · 위 마진 20 = screen gap16 + mt-1 */}
      <View className="mt-1 gap-2">
        <AppText variant="body" className="text-foreground">
          방법
        </AppText>
        {steps.map((step, i) => (
          <View key={i} className="flex-row gap-2">
            <View className="w-4 items-center gap-1 pt-3">
              <Text className="text-[16px] font-medium leading-[21px] text-primary">{i + 1}</Text>
              {i > 0 ? (
                <Pressable onPress={() => moveStepUp(i)} hitSlop={6} accessibilityLabel="위로">
                  <Feather name="arrow-up" size={16} color={palette.muted} />
                </Pressable>
              ) : null}
            </View>
            <View className="flex-1 gap-2 rounded-[12px] bg-field p-3">
              <TextInput
                className="rounded-[12px] bg-background px-4 py-2.5 text-foreground"
                style={{ fontSize: 16, lineHeight: 21, minHeight: 62 }}
                placeholder="예: 끓는 물에 소면을 3분 넣는다"
                placeholderTextColor={palette.muted}
                multiline
                value={step}
                onChangeText={(t) => setStep(i, t)}
              />
              <Pressable
                onPress={() => removeStep(i)}
                className="self-end"
                accessibilityRole="button"
                accessibilityLabel="단계 삭제"
              >
                <Text className="text-[13px] text-muted">삭제</Text>
              </Pressable>
            </View>
          </View>
        ))}
        {/* 위 12 = gap8+mt-1 */}
        <DashedAddButton label="단계 추가" onPress={addStep} className="mt-1" />
      </View>

      <Button
        label={uploading ? '사진 업로드 중…' : '저장하기'}
        onPress={onSave}
        disabled={create.isPending || uploading}
      />
    </Screen>
  );
}

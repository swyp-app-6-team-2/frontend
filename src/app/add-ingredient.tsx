import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';
import {
  useAddCustomIngredient,
  useAddMyIngredients,
  useIngredients,
  useMyIngredients,
} from '@/hooks/use-api';
import { ApiError } from '@/lib/api';

// 재료 직접 입력 — 입력한 이름이 마스터(이름·별칭)와 일치하면 마스터로(아이콘·카테고리 포함),
// 아니면 커스텀 재료로 등록한다(POST /users/me/ingredients/custom).
export default function AddIngredientScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: master } = useIngredients();
  const items = useMemo(() => master?.ingredients ?? [], [master]);
  const { data: mine } = useMyIngredients();
  // 마스터 중복 방지용 보유 마스터 id 집합(커스텀은 같은 이름도 새 항목 허용이라 제외).
  const ownedMaster = useMemo(
    () =>
      new Set(
        (mine?.ingredients ?? [])
          .filter((it) => it.ingredientType === 'MASTER')
          .map((it) => it.ingredientId),
      ),
    [mine],
  );
  const addMutation = useAddMyIngredients();
  const customMutation = useAddCustomIngredient();
  const pending = addMutation.isPending || customMutation.isPending;

  const canSubmit = name.trim().length > 0 && !pending;

  const onSubmit = () => {
    if (!canSubmit) return;
    const trimmed = name.trim();
    const typed = trimmed.toLowerCase();
    const match = items.find(
      (it) => it.name.toLowerCase() === typed || it.aliases.some((a) => a.toLowerCase() === typed),
    );
    const handlers = {
      onSuccess: () => router.back(),
      onError: (e: unknown) =>
        setError(e instanceof ApiError ? e.message : '등록에 실패했어요. 다시 시도해주세요.'),
    };
    if (match) {
      if (ownedMaster.has(match.ingredientId)) {
        setError('이미 등록된 재료예요.');
        return;
      }
      // 마스터 일치 → POST /users/me/ingredients (아이콘·카테고리 포함 등록).
      addMutation.mutate([match.ingredientId], handlers);
      return;
    }
    // 마스터에 없으면 커스텀으로 등록. 성공 시 my-ingredients 무효화로 재료관리에 자동 반영.
    customMutation.mutate(trimmed, handlers);
  };

  return (
    <Screen title="재료 직접 입력" back>
      <View className="flex-1">
        <AppText variant="title" className="mt-2 leading-[31px]">
          직접 입력하실 재료를{'\n'}입력해주세요
        </AppText>
        <SearchBar
          placeholder="재료명을 검색해보세요"
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (error) setError(null);
          }}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          leftIcon={null}
          containerClassName="mt-6"
          autoFocus
        />
        {error ? (
          <Text className="mt-2 pl-1 text-[13px] leading-[18px] text-error">{error}</Text>
        ) : null}
      </View>

      <View className="pb-8">
        <Button
          label={pending ? '등록 중…' : '완료하기'}
          disabled={!canSubmit}
          onPress={onSubmit}
        />
      </View>
    </Screen>
  );
}

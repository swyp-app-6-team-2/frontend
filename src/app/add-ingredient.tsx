import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';
import { useAddMyIngredients, useIngredients, useMyIngredients } from '@/hooks/use-api';
import { ApiError } from '@/lib/api';

// 재료 직접 입력 — 입력한 이름을 마스터(이름·별칭)에 매칭해 등록한다.
// 백엔드는 마스터 재료 id만 저장할 수 있어(자유입력 저장 API 없음), 목록에 없는 이름은 등록 불가.
export default function AddIngredientScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: master } = useIngredients();
  const items = useMemo(() => master?.ingredients ?? [], [master]);
  const { data: mine } = useMyIngredients();
  const owned = useMemo(
    () => new Set((mine?.ingredients ?? []).map((it) => it.ingredientId)),
    [mine],
  );
  const addMutation = useAddMyIngredients();

  const canSubmit = name.trim().length > 0 && !addMutation.isPending;

  const onSubmit = () => {
    if (!canSubmit) return;
    const typed = name.trim().toLowerCase();
    const match = items.find(
      (it) => it.name.toLowerCase() === typed || it.aliases.some((a) => a.toLowerCase() === typed),
    );
    if (!match) {
      setError('목록에 없는 재료예요. ‘재료 추가하기’ 목록에서 찾아 등록해주세요.');
      return;
    }
    if (owned.has(match.ingredientId)) {
      setError('이미 등록된 재료예요.');
      return;
    }
    // POST /users/me/ingredients → 성공 시 my-ingredients 무효화로 재료관리에 자동 반영.
    addMutation.mutate([match.ingredientId], {
      onSuccess: () => router.back(),
      onError: (e) =>
        setError(e instanceof ApiError ? e.message : '등록에 실패했어요. 다시 시도해주세요.'),
    });
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
          label={addMutation.isPending ? '등록 중…' : '완료하기'}
          disabled={!canSubmit}
          onPress={onSubmit}
        />
      </View>
    </Screen>
  );
}

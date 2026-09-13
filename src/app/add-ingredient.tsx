import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen, SearchBar } from '@/components/ui';

// 재료 직접 입력 — 마스터 목록에 없는 재료를 직접 입력. (재료 추가하기의 '직접 입력할게요'에서 진입)
export default function AddIngredientScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const canSubmit = name.trim().length > 0;

  const onSubmit = () => {
    if (!canSubmit) return;
    // TODO: 백엔드 '내 재료 저장'(커스텀 재료 추가) API가 생기면 name 전송.
    router.back();
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
          onChangeText={setName}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          leftIcon={null}
          containerClassName="mt-6"
          autoFocus
        />
      </View>

      <View className="pb-8">
        <Button label="완료하기" disabled={!canSubmit} onPress={onSubmit} />
      </View>
    </Screen>
  );
}

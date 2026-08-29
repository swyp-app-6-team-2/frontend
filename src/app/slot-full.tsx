import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

// [stub] 23 슬롯 한도 초과 안내.
export default function SlotFullScreen() {
  const router = useRouter();
  return (
    <Screen title="저장 슬롯" back scroll>
      <View className="items-center gap-3 py-10">
        <Text className="text-[44px]">📦</Text>
        <AppText variant="title" className="text-center">
          저장 슬롯이 가득 찼어요
        </AppText>
        <AppText variant="body" className="text-center text-muted">
          레시피 저장 슬롯(50/50)을 모두 사용했어요
        </AppText>
      </View>
      <View className="gap-3">
        <Button label="취소" variant="secondary" onPress={() => router.back()} />
        <Button label="슬롯 확장하기" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, Button, Screen } from '@/components/ui';

// [stub] 19-1 URL 등록 실패 안내.
export default function UrlFailedScreen() {
  const router = useRouter();
  return (
    <Screen title="URL로 등록" back scroll>
      <View className="items-center gap-3 py-10">
        <Text className="text-[44px]">⚠️</Text>
        <AppText variant="title" className="text-center">
          링크를 분석하지 못했어요
        </AppText>
        <AppText variant="body" className="text-center text-muted">
          다른 링크로 다시 시도하거나 직접 입력해주세요
        </AppText>
      </View>
      <View className="gap-3">
        <Button label="다른 링크로 다시 시도" variant="secondary" onPress={() => router.back()} />
        <Button label="직접 입력할게요" onPress={() => router.replace('/add-recipe-manual')} />
      </View>
    </Screen>
  );
}

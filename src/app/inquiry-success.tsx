import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { AppText, Screen } from '@/components/ui';

// 문의 접수 완료 — 폼 제출 성공 시 노출. 완료하기로 진입 직전 화면 복귀.
export default function InquirySuccessScreen() {
  const router = useRouter();
  return (
    <Screen title="" back>
      {/* 중앙 마스코트 + 안내 문구 (gap 34) */}
      <View className="flex-1 items-center justify-center gap-[34px]">
        <Image
          source={require('../assets/images/inquiry-success.png')}
          style={{ width: 136, height: 121 }}
          contentFit="contain"
        />
        <View className="items-center gap-3">
          <AppText variant="subheading" className="text-center">
            문의가 정상적으로{'\n'}접수되었습니다
          </AppText>
          <AppText variant="body" className="text-center text-muted">
            확인 후 이메일로 답변 드릴게요
          </AppText>
        </View>
      </View>

      {/* 하단 고정 버튼 (완료하기) */}
      <View className="pb-8 pt-4">
        <Pressable
          className="h-[52px] items-center justify-center rounded-[30px] bg-primary active:opacity-90"
          accessibilityRole="button"
          onPress={() => router.back()}
        >
          <Text className="text-body font-semibold text-ink">완료하기</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

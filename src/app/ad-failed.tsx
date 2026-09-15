import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/ui';

// 광고 불러오기 실패 — 광고 SDK가 광고를 못 불러왔을 때 이동하는 안내 화면.
// 하단: 닫기(회색) / 다시 시도(골드).
export default function AdFailedScreen() {
  const router = useRouter();

  return (
    <Screen title="" back>
      <View className="flex-1 items-center justify-center gap-6">
        {/* 일러스트 — '광고 없음' 말풍선 + 우는 마스코트 */}
        <View className="items-center">
          <Image
            source={require('../assets/images/ad-failed-noad.png')}
            style={{ width: 109, height: 87 }}
            contentFit="contain"
          />
          <Image
            source={require('../assets/images/ad-failed-mascot.png')}
            style={{ width: 135, height: 121, marginTop: 4 }}
            contentFit="contain"
          />
        </View>

        {/* 안내 문구 (Frame 358) */}
        <View className="items-center gap-4">
          <Text className="text-[22px] font-bold leading-[29px] text-foreground">
            지금은 광고를 불러올 수 없어요
          </Text>
          <Text className="text-center text-[16px] font-medium leading-[21px] text-body-muted">
            잠시 후 다시 시도해 주세요
          </Text>
        </View>
      </View>

      {/* 하단 두 버튼 (버튼 두개) — 닫기(회색) / 다시 시도(골드) */}
      <View className="flex-row gap-3 pb-8 pt-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-popup-button active:opacity-80"
        >
          <Text className="text-[16px] font-semibold leading-[21px] text-popup-button-text">
            닫기
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="h-[52px] flex-1 items-center justify-center rounded-[30px] bg-primary active:opacity-90"
        >
          <Text className="text-[16px] font-semibold leading-[21px] text-ink">다시 시도</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

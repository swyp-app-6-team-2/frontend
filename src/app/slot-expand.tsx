import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { AppText, Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useCanWatchAd, watchAd } from '@/lib/slot-ads';

const DAILY_LIMIT = 3;

// 슬롯 확장 — 광고 시청 시 별 슬롯 +2 (하루 최대 3회).
// 하단 '광고 보기' → 광고 시청 완료 → 홈으로 돌아가며 성공 팝업 노출.
// 오늘 한도를 다 쓰면 비활성(다음날 리셋은 백엔드/저장소 필요 — 지금은 세션 카운트).
export default function SlotExpandScreen() {
  const router = useRouter();
  const canWatch = useCanWatchAd();

  const onWatch = () => {
    if (!canWatch) return;
    watchAd(); // 슬롯 +2(세션) + 홈 성공 팝업 예약
    router.replace('/home'); // 홈으로 돌아가며 팝업 표시
  };

  return (
    <Screen title="슬롯 확장" back>
      <View className="flex-1 gap-4 pt-2">
        {/* 안내 카드 */}
        <View className="rounded-[12px] bg-field p-4">
          <AppText variant="body" className="font-medium leading-[18px] text-muted">
            ⓘ 광고 시청 시 별 슬롯 2개가 추가돼요. 하루 최대 {DAILY_LIMIT}번까지 광고를 시청하고, 더
            많은 별 레시피를 저장해보세요!
          </AppText>
        </View>

        {/* 광고 리워드 상태 pill — 활성(골드 라인)/비활성(회색 라인). 실제 시청은 하단 버튼 */}
        <View
          className={`h-16 flex-row items-center justify-between rounded-pill border px-6 ${
            canWatch ? 'border-primary bg-surface' : 'border-disabled-line bg-background'
          }`}
        >
          <View className="flex-row items-center gap-3">
            <Feather
              name="play-circle"
              size={24}
              color={canWatch ? palette.foreground : palette.muted}
            />
            <Text
              className={`text-[16px] font-bold leading-[21px] ${
                canWatch ? 'text-foreground' : 'text-body-muted'
              }`}
            >
              광고 시청하고 슬롯 확장
            </Text>
          </View>
          <Text
            className={`text-[16px] font-semibold leading-[21px] ${
              canWatch ? 'text-primary' : 'text-body-muted'
            }`}
          >
            +2개
          </Text>
        </View>

        {/* 오늘 다 시청한 경우 안내 */}
        {!canWatch ? (
          <Text className="mt-4 self-center text-center text-[16px] leading-[21px] text-body-muted">
            오늘 시청 가능한 횟수를 모두 사용했어요{'\n'}내일 다시 시청할 수 있어요
          </Text>
        ) : null}
      </View>

      <View className="pb-8">
        <Button
          label="광고 보기"
          onPress={onWatch}
          disabled={!canWatch}
          className="rounded-[30px]"
        />
      </View>
    </Screen>
  );
}

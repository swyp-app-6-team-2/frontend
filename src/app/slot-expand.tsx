import { useState } from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { SlotAddedPopup } from '@/components/slot-added-popup';
import { Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useAdRewardStatus } from '@/hooks/use-api';
import { AD_DAILY_LIMIT, dismissSlotAdded, watchAd } from '@/lib/slot-ads';

// 슬롯 확장 — 광고 시청 시 별 슬롯 지급 (하루 한도 내).
// 잔여 시청 한도·시청 가능 여부·불가 사유는 서버(GET /ads/rewards/status)에서 받는다.
// ⚠️ 실제 광고 시청(세션 발급→AdMob→SSV 지급)은 아직 스텁(watchAd) — AdMob SDK 연동 시 교체.
export default function SlotExpandScreen() {
  const { data: status, isLoading } = useAdRewardStatus();
  // 서버 진실을 우선. 로딩 중이면 버튼 비활성(안전).
  const canWatch = status?.canWatchAd ?? false;
  const dailyLimit = status?.dailyRewardLimit ?? AD_DAILY_LIMIT;
  const remaining = status?.remainingRewardCount ?? 0;
  const reason = status?.unavailableReason ?? null;
  const [showAdded, setShowAdded] = useState(false);

  const onWatch = () => {
    if (!canWatch) return;
    watchAd(); // TODO(AdMob): 세션 발급→광고 시청→결과 폴링으로 교체. 현재는 스텁 지급.
    setShowAdded(true); // 광고 시청 완료 → 이 화면에서 성공 모달
  };

  const onCloseAdded = () => {
    dismissSlotAdded(); // 홈 중복 팝업 방지
    setShowAdded(false); // 팝업만 닫고 슬롯 확장 화면에 머묾
  };

  return (
    <Screen title="슬롯 확장" back>
      <View className="flex-1 gap-4 pt-2">
        {/* 안내 카드 (Frame 311) — field·radius 12·padding 16·14/500 muted */}
        <View className="rounded-[12px] bg-field p-4">
          <Text className="text-[14px] font-medium leading-[18px] text-muted">
            광고 시청 시 별 슬롯 2개가 추가돼요.{'\n'}하루 최대 {dailyLimit}번 광고 시청하고
            레시피를 더 저장해보세요!
          </Text>
        </View>

        {/* 리워드 안내 카드 (Frame 314) — 활성 골드 라인 / 소진 시 회색 라인 (표시용) */}
        <View
          className={`h-16 flex-row items-center justify-between rounded-pill border px-6 ${
            canWatch ? 'border-primary bg-surface' : 'border-disabled-line bg-background'
          }`}
        >
          <View className="flex-row items-center gap-3">
            <Feather name="play-circle" size={24} color={palette.foreground} />
            <Text className="text-[16px] font-bold leading-[21px] text-foreground">
              광고 시청하고 슬롯 확장
            </Text>
          </View>
          <Text className="text-[16px] font-semibold leading-[21px] text-primary">+ 2개</Text>
        </View>

        {/* 불가 안내 (Frame 358) — 사유별 문구. 로딩 중엔 안 띄운다 */}
        {!isLoading && !canWatch ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-[16px] font-medium leading-[21px] text-body-muted">
              {reason === 'REWARD_PENDING'
                ? '이전 광고 보상을 확인하고 있어요.\n잠시 후 다시 시도해주세요'
                : '오늘 시청 가능한 횟수를 모두 사용했어요!\n내일 다시 시청할 수 있어요'}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 하단 — 잔여 시청 한도 툴팁 + 광고 시청하기 */}
      <View className="pb-8">
        {/* 잔여 시청 한도 (Frame 1437264004) — 테두리 pill + 아래 삼각 포인터 */}
        <View className="mb-4 items-center">
          <View className="flex-row items-center gap-3 rounded-pill border border-disabled-line bg-background px-6 py-[14px]">
            <Text className="text-[14px] font-medium leading-[18px] text-foreground">
              잔여 시청 한도
            </Text>
            <Text className="text-[14px] font-medium leading-[18px] text-primary">
              {remaining}/{dailyLimit}
            </Text>
          </View>
          {/* 아래를 가리키는 삼각 포인터 (border trick) */}
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 8,
              borderRightWidth: 8,
              borderTopWidth: 10,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: palette.disabledLine,
            }}
          />
        </View>

        {/* 광고 시청하기 (메인버튼) — primary·radius 30·h52. 오늘 한도 소진 시 비활성 */}
        <Button
          label={canWatch || isLoading ? '광고 시청하기' : '완료하기'}
          onPress={onWatch}
          disabled={!canWatch}
          className="rounded-[30px]"
        />
      </View>

      {/* 광고 시청 완료 성공 모달 */}
      <SlotAddedPopup visible={showAdded} onClose={onCloseAdded} />
    </Screen>
  );
}

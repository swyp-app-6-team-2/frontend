import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { SlotAddedPopup } from '@/components/slot-added-popup';
import { Button, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { queryKeys, useAdRewardStatus, useCreateAdRewardSession } from '@/hooks/use-api';
import { adPlatform, fallbackRewardedUnitId, initAds, showRewardedAd } from '@/lib/ads';
import { trackEvent } from '@/lib/analytics';
import { adRewardApi, ApiError, type AdRewardCancelReason } from '@/lib/api';
import { AD_DAILY_LIMIT, dismissSlotAdded, markSlotAdded } from '@/lib/slot-ads';

// 슬롯 확장 — 보상형 광고 시청 시 서버 SSV 검증 후 별 슬롯 +2 (하루 한도 내).
// 흐름(REWARDED_AD_SSV.md): createSession → 광고 표시(customData=sessionId) → onUserEarnedReward →
//   getResult 폴링 → 서버가 Google SSV 콜백 검증 후 GRANTED → 성공 팝업. 지급은 오직 서버 결과.
type Phase = 'idle' | 'watching' | 'verifying';

// SSV 콜백은 광고 종료보다 늦게 올 수 있다. 2초 간격으로 폴링(≈24초). 그 안에 안 오면 "지연"으로
// 안내하고 막지 않는다 — 늦게 지급돼도 상태 새로고침으로 반영된다(아래 '새로고침' 버튼).
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TRIES = 12;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function SlotExpandScreen() {
  const { data: status, isLoading, refetch: refetchStatus } = useAdRewardStatus();
  const createSession = useCreateAdRewardSession();
  const qc = useQueryClient();

  const [phase, setPhase] = useState<Phase>('idle');
  const [showAdded, setShowAdded] = useState(false);

  const busy = phase !== 'idle';
  // 서버 진실 우선. 로딩/진행 중이면 버튼 비활성(안전).
  const canWatch = (status?.canWatchAd ?? false) && !busy;
  const dailyLimit = status?.dailyRewardLimit ?? AD_DAILY_LIMIT;
  const remaining = status?.remainingRewardCount ?? 0;
  const reason = status?.unavailableReason ?? null;

  // 광고 종료 후 서버 지급(SSV) 결과를 폴링. GRANTED면 true. (직접 슬롯 증가 X — 서버 결과만 신뢰)
  // PENDING이면 계속 폴링, 종료 상태(REJECTED/EXPIRED/CANCELLED)면 대기 없이 즉시 실패로 종료.
  const pollGranted = async (sessionId: string): Promise<boolean> => {
    for (let i = 0; i < POLL_MAX_TRIES; i++) {
      try {
        const r = await adRewardApi.getResult(sessionId);
        if (r.status === 'GRANTED') return true;
        if (r.status !== 'PENDING') return false; // 종료 상태 — 더 기다릴 필요 없음
      } catch {
        // 일시 오류는 무시하고 재시도(만료/실패는 다음 조회에서 드러남).
      }
      await sleep(POLL_INTERVAL_MS);
    }
    return false;
  };

  // 예약된 세션 해제(닫음/실패). 실패해도 서버가 만료로 자동 회수하므로 best-effort로 무시.
  const cancelSessionSafely = async (sessionId: string, reason: AdRewardCancelReason) => {
    try {
      await adRewardApi.cancelSession(sessionId, { reason });
    } catch {
      // 취소 실패 무시 — 만료 시 서버가 예약을 회수한다.
    }
  };

  const onWatch = async () => {
    if (!canWatch) return;
    let sessionId: string | null = null; // 실패 시 취소 대상(생성 전이면 null)
    try {
      setPhase('watching');
      trackEvent('Ad Watch Started', { platform: adPlatform() }); // 광고 퍼널 시작(시작→완주 이탈)
      // 멱등 키 — 버튼 재터치·재시도 시 동일 세션 재사용(서버가 (userId, requestId) UNIQUE 관리).
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const session = await createSession.mutateAsync({ platform: adPlatform(), requestId });
      sessionId = session.sessionId;
      await initAds();
      // 광고 단위는 서버가 내려준 값 우선, 없으면 실제 단위 폴백(백엔드 미반영 대비).
      const adUnitId = session.adUnitId || fallbackRewardedUnitId();
      const outcome = await showRewardedAd(adUnitId, session.customData);
      if (outcome !== 'earned') {
        // 보상 없이 닫음 — 예약 세션 해제(다음 시청 한도 확보) 후 상태 갱신.
        await cancelSessionSafely(session.sessionId, 'USER_DISMISSED');
        setPhase('idle');
        await refetchStatus();
        return;
      }
      // 보상 이벤트 수신 → 서버 SSV 검증 결과를 폴링한다.
      setPhase('verifying');
      const granted = await pollGranted(session.sessionId);
      setPhase('idle');
      await refetchStatus(); // 잔여 시청 한도 갱신(adRewardStatus)
      if (granted) {
        // 서버가 슬롯 +2 지급 → 프로필(me) 캐시를 무효화해야 홈/마이의 '남은 별'이 즉시 반영된다.
        // (남은 별 = 슬롯 한도 − 레시피 수, me()에서 계산 — 레시피 생성/삭제와 동일 패턴)
        await qc.invalidateQueries({ queryKey: queryKeys.me() });
        trackEvent('Ad Reward Granted', { platform: adPlatform() });
        setShowAdded(true);
        markSlotAdded(); // 홈 복귀 시에도 성공 팝업(서버 지급 확인됨)
      } else {
        Alert.alert(
          '보상 확인이 지연되고 있어요',
          '잠시 후 슬롯에 자동 반영됩니다. 상태는 새로고침 시 갱신돼요.',
        );
      }
    } catch (e) {
      // 광고 로드/표시 실패 — 세션이 생성됐다면 해제해 한도를 돌려준다.
      if (sessionId) await cancelSessionSafely(sessionId, 'LOAD_FAILED');
      setPhase('idle');
      await refetchStatus();
      Alert.alert(
        '광고를 불러오지 못했어요',
        e instanceof ApiError ? e.message : '잠시 후 다시 시도해주세요.',
      );
    }
  };

  const onCloseAdded = () => {
    dismissSlotAdded(); // 홈 중복 팝업 방지
    setShowAdded(false); // 팝업만 닫고 슬롯 확장 화면에 머묾
  };

  // 보상 대기(REWARD_PENDING) — 광고는 봤으나 서버 지급 확정이 지연. 막지 말고 '새로고침'으로
  // 늦은 지급을 재확인하게 한다(상태가 갱신되면 한도 차감·슬롯 반영이 드러난다).
  const pending = !busy && !canWatch && reason === 'REWARD_PENDING';
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // 늦은 지급 재확인 — 잔여 한도(adRewardStatus)와 남은 별(me) 둘 다 갱신.
      await Promise.all([refetchStatus(), qc.invalidateQueries({ queryKey: queryKeys.me() })]);
    } finally {
      setRefreshing(false);
    }
  };

  const onButton = canWatch ? onWatch : pending ? onRefresh : () => {};
  const buttonDisabled = busy || refreshing || (!canWatch && !pending);
  const buttonLabel = busy
    ? phase === 'verifying'
      ? '보상 확인 중…'
      : '광고 준비 중…'
    : refreshing
      ? '확인 중…'
      : canWatch || isLoading
        ? '광고 시청하기'
        : pending
          ? '보상 확인 새로고침'
          : '완료하기';

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

        {/* 진행 중 안내 / 불가 안내 (Frame 358) */}
        {busy ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator color={palette.primary} />
            <Text className="text-center text-[16px] font-medium leading-[21px] text-body-muted">
              {phase === 'verifying'
                ? '보상을 확인하고 있어요.\n잠시만 기다려주세요'
                : '광고를 준비하고 있어요…'}
            </Text>
          </View>
        ) : !isLoading && !canWatch ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-[16px] font-medium leading-[21px] text-body-muted">
              {reason === 'REWARD_PENDING'
                ? '이전 광고 보상을 확인하고 있어요.\n아래 새로고침으로 다시 확인할 수 있어요'
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

        {/* 광고 시청하기 (메인버튼) — primary·radius 30·h52. 진행 중/한도 소진 시 비활성 */}
        <Button
          label={buttonLabel}
          onPress={onButton}
          disabled={buttonDisabled}
          className="rounded-[30px]"
        />
      </View>

      {/* 광고 시청 완료 성공 모달 */}
      <SlotAddedPopup visible={showAdded} onClose={onCloseAdded} />
    </Screen>
  );
}

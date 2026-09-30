// AdMob 보상형 광고 — 백엔드 SSV 리워드 흐름의 프런트 담당(광고 로드·재생).
// 백엔드 문서(REWARDED_AD_SSV.md) 계약:
//   createSession → {sessionId, adUnitId, customData=sessionId} → 광고 표시 전 customData 설정 →
//   onUserEarnedReward(보상 확인 중) → getResult 폴링 → 서버 SSV 검증 GRANTED → 슬롯 +2.
//   ⚠️ onUserEarnedReward로 슬롯을 직접 늘리지 않는다. 지급은 오직 서버 SSV 결과.
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

let initialized = false;

// MobileAds 초기화 — 앱 시작 시 1회. 에뮬레이터/개발 기기는 테스트 광고를 받도록 test device 등록.
// (실광고 단위라도 test device에선 테스트 광고가 나와 계정 리스크 없이 SSV까지 검증된다.)
// iOS는 광고 로드 전 ATT(추적 투명성) 권한을 물어야 정책상 안전(거절해도 비개인화 광고로 진행).
export async function initAds(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (Platform.OS === 'ios') {
    try {
      const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
      await requestTrackingPermissionsAsync();
    } catch {
      // ATT 실패해도 광고는 비개인화로 계속 로드한다.
    }
  }
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.G,
    testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
  });
  await mobileAds().initialize();
}

export type ShowRewardedResult = 'earned' | 'dismissed';

/**
 * 보상형 광고 1건을 로드→표시한다. `onUserEarnedReward`가 오면 'earned', 보상 없이 닫으면 'dismissed'.
 * 지급 확정은 호출측이 서버 getResult 폴링으로 판단한다(이 함수는 슬롯을 늘리지 않는다).
 *
 * @param adUnitId 서버가 세션마다 내려주는 실제 광고 단위(SSV 콜백이 백엔드로 연결됨). 개발 기기는
 *   test device로 등록돼 실단위라도 테스트 광고가 나오므로 계정 리스크 없이 SSV까지 검증된다.
 * @param customData 세션 ID — AdMob SSV custom_data로 실려 백엔드 콜백에서 세션을 식별한다.
 */
export function showRewardedAd(adUnitId: string, customData: string): Promise<ShowRewardedResult> {
  const rewarded = RewardedAd.createForAdRequest(adUnitId, {
    // 표시 전(로드 요청 시) customData 설정 — 광고 인스턴스와 세션을 1:1로 묶는다.
    serverSideVerificationOptions: { customData },
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise((resolve, reject) => {
    let earned = false;
    const subs: (() => void)[] = [];
    const cleanup = () => subs.forEach((s) => s());

    subs.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show().catch((e) => {
          cleanup();
          reject(e);
        });
      }),
    );
    subs.push(
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true; // 지급 자체는 서버 SSV로. 여기선 '보상 이벤트 수신'만 표시.
      }),
    );
    subs.push(
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        resolve(earned ? 'earned' : 'dismissed');
      }),
    );
    subs.push(
      rewarded.addAdEventListener(AdEventType.ERROR, (err) => {
        cleanup();
        reject(err instanceof Error ? err : new Error('광고 로드 실패'));
      }),
    );

    rewarded.load();
  });
}

// 플랫폼 문자열 — createSession 요청 body의 platform 필드.
export const adPlatform = (): 'ANDROID' | 'IOS' => (Platform.OS === 'ios' ? 'IOS' : 'ANDROID');

import { View } from 'react-native';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

import { ListRow, Screen } from '@/components/ui';
import { POLICY_URLS } from '@/constants/policy-links';

// 약관 — 마이페이지 '약관' 진입. 각 항목 탭 → 노션 원문(인앱 브라우저).
// (신규 가입의 '서비스 이용 동의' 체크박스 화면은 /terms 로 별개)
const ITEMS: { label: string; url: string }[] = [
  { label: '서비스 이용약관', url: POLICY_URLS.tos },
  { label: '개인정보 처리방침', url: POLICY_URLS.privacy },
  { label: '서비스 알림 수신 동의', url: POLICY_URLS.notify },
  { label: '마케팅 정보 수신 동의', url: POLICY_URLS.marketing },
];

export default function PoliciesScreen() {
  return (
    <Screen title="약관" back>
      {/* 리스트 (행 간격 32px) — 상단 정렬 */}
      <View className="gap-8 pt-2">
        {ITEMS.map(({ label, url }) => (
          <ListRow
            key={label}
            label={label}
            onPress={() =>
              openBrowserAsync(url, {
                presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
              })
            }
          />
        ))}
      </View>
    </Screen>
  );
}

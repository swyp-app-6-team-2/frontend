import { View } from 'react-native';

import { AppText, ListRow, Screen } from '@/components/ui';

// 약관 — 법적 고지 문서 목록 + 최종 업데이트 표기.
const ITEMS = ['서비스 이용약관', '개인정보 처리방침', '환불 정책', '마케팅 정보 수신 동의'];

const LAST_UPDATED = '2026.08.01';

export default function TermsScreen() {
  return (
    <Screen title="약관" back>
      {/* 리스트 (행 간격 32px) — 상단 정렬 */}
      <View className="flex-1 gap-8 pt-2">
        {ITEMS.map((label) => (
          <ListRow key={label} label={label} onPress={() => {}} />
        ))}
      </View>

      {/* 최종 업데이트 — 하단 중앙 고정 */}
      <View className="items-center py-5">
        <AppText variant="chip" className="font-medium text-body-muted">
          최종 업데이트 {LAST_UPDATED}
        </AppText>
      </View>
    </Screen>
  );
}

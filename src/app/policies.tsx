import { View } from 'react-native';

import { ListRow, Screen } from '@/components/ui';

// 약관 — 마이페이지 '약관' 진입. 법적 고지 문서 목록(각 항목 → 상세 문서, 추후 연결).
// (신규 가입의 '서비스 이용 동의' 체크박스 화면은 /terms 로 별개)
const ITEMS = ['서비스 이용약관', '개인정보 처리방침', '환불 정책', '마케팅 정보 수신 동의'];

export default function PoliciesScreen() {
  return (
    <Screen title="약관" back>
      {/* 리스트 (행 간격 32px) — 상단 정렬 */}
      <View className="gap-8 pt-2">
        {ITEMS.map((label) => (
          <ListRow key={label} label={label} onPress={() => {}} />
        ))}
      </View>
    </Screen>
  );
}

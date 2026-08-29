import { ListRow, Screen } from '@/components/ui';

// [stub] 약관 · 정책.
const ITEMS = ['서비스 이용약관', '개인정보 처리방침', '환불 정책'];

export default function TermsScreen() {
  return (
    <Screen title="약관 · 정책" back scroll>
      {ITEMS.map((label) => (
        <ListRow key={label} label={label} onPress={() => {}} />
      ))}
    </Screen>
  );
}

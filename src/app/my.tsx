import { useRouter } from 'expo-router';

import { AppText, ListRow, Screen, Section } from '@/components/ui';

// [stub] 마이 — 슬롯 사용량, 설정, 약관 등.
export default function MyScreen() {
  const router = useRouter();
  return (
    <Screen title="마이" scroll>
      <AppText variant="body" className="text-muted">
        ⭐ 요리 완료 횟수 · 저장 슬롯(예: 12/50) 요약이 들어갈 자리
      </AppText>
      <Section title="설정">
        <ListRow label="약관 · 정책" onPress={() => router.push('/terms')} />
        <ListRow label="저장 슬롯 관리" onPress={() => router.push('/slot-full')} />
      </Section>
      <Section title="개발용">
        <ListRow label="디자인 시스템" onPress={() => router.push('/design-system')} />
      </Section>
    </Screen>
  );
}

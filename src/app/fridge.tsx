import { useRouter } from 'expo-router';

import { AppText, Button, ListRow, Screen, Section } from '@/components/ui';

// [stub] 재료관리 / 내 냉장고 — 유통기한 임박 재료, 전체 재료 목록.
const SOON = ['두부 · D-1 · 1개', '배추 · D-3', '양파 · D-5'];

export default function FridgeScreen() {
  const router = useRouter();
  return (
    <Screen title="내 냉장고" scroll>
      <Section title="임박 재료">
        {SOON.map((label) => (
          <ListRow key={label} label={label} showChevron={false} />
        ))}
      </Section>
      <AppText variant="body" className="text-muted">
        전체 재료(카테고리별 · 유통기한)가 들어갈 자리
      </AppText>
      <Button label="+ 재료 추가" onPress={() => router.push('/add-ingredient')} />
    </Screen>
  );
}

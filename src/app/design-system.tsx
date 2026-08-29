import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppText, Button, Chip, ListRow, Screen, SearchBar, Section } from '@/components/ui';
import { palette, type PaletteColor } from '@/constants/tokens';

const SWATCHES: PaletteColor[] = [
  'background',
  'surface',
  'field',
  'primary',
  'primarySubtle',
  'onPrimary',
  'muted',
  'disabled',
  'success',
  'error',
];

const CHIPS = ['전체', '한식', '김치', '돼지고기', '간편식'];

export default function DesignSystemScreen() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('전체');

  return (
    <Screen scroll>
      <AppText variant="title" className="text-primary">
        별따먹자 · 디자인 시스템
      </AppText>

      <Section title="색상">
        <View className="flex-row flex-wrap gap-3">
          {SWATCHES.map((name) => (
            <View key={name} className="gap-1">
              <View
                className="size-16 rounded-card border border-foreground/10"
                style={{ backgroundColor: palette[name] }}
              />
              <AppText variant="chip" className="text-muted">
                {name}
              </AppText>
            </View>
          ))}
        </View>
      </Section>

      <Section title="버튼">
        <Button label="완료하기" onPress={() => {}} />
        <Button label="다시 확인할게요" variant="secondary" onPress={() => {}} />
        <Button label="완료하기" disabled />
      </Section>

      <Section title="검색바">
        <SearchBar value={search} onChangeText={setSearch} />
      </Section>

      <Section title="칩">
        <View className="flex-row flex-wrap gap-2">
          {CHIPS.map((label) => (
            <Chip
              key={label}
              label={label}
              active={selected === label}
              onPress={() => setSelected(label)}
            />
          ))}
        </View>
      </Section>

      <Section title="리스트">
        {/* 리스트 행 간격은 32px(gap-8)로 통일 */}
        <View className="gap-8">
          <ListRow label="서비스 이용약관" onPress={() => {}} />
          <ListRow
            label="앱 버전"
            showChevron={false}
            right={
              <AppText variant="body" className="text-muted">
                1.0.0
              </AppText>
            }
          />
          <ListRow
            label="알림"
            subtitle="푸시 알림 받기"
            leftIcon={<Text className="text-body">🔔</Text>}
            onPress={() => {}}
          />
        </View>
      </Section>
    </Screen>
  );
}

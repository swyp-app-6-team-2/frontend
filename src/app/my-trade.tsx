import { useState } from 'react';
import { View } from 'react-native';

import { ListRow, Screen, SearchBar } from '@/components/ui';

const MENU = ['서비스 이용약관', '개인정보 처리방침', '환불 정책'];

export default function MyTradeScreen() {
  const [search, setSearch] = useState('');

  // Screen handles bg / safe-area / margin / header. Just describe the content.
  return (
    <Screen title="나의 거래" back>
      <View className="mt-2 gap-8">
        {MENU.map((label) => (
          <ListRow key={label} label={label} onPress={() => {}} />
        ))}
      </View>

      <View className="flex-1" />

      <SearchBar value={search} onChangeText={setSearch} />
    </Screen>
  );
}

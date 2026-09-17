import { RefreshControl } from 'react-native';

import { palette } from '@/constants/tokens';

export type AppRefreshControlProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

// 다크 테마 당겨서 새로고침 스피너 — iOS는 tintColor, Android는 colors/progressBackground.
// useRefresh()의 반환값을 그대로 펼쳐 넣는다: <AppRefreshControl {...useRefresh()} />
export function AppRefreshControl({ refreshing, onRefresh }: AppRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={palette.primary}
      colors={[palette.primary]}
      progressBackgroundColor={palette.field}
    />
  );
}

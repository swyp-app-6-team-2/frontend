import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// 당겨서 새로고침 — 현재 화면에 마운트된(활성) 쿼리를 staleTime 무시하고 다시 불러온다.
// 화면마다 어떤 쿼리를 쓰는지 일일이 넘길 필요 없이 useRefresh() 하나로 통일한다.
// 반환값을 <AppRefreshControl {...refresh} />에 펼쳐 ScrollView/FlatList의 refreshControl로 쓴다.
export function useRefresh() {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await qc.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [qc]);
  return { refreshing, onRefresh };
}

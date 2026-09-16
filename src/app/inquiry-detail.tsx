import { ActivityIndicator, Image, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { AppText, Screen } from '@/components/ui';
import { palette } from '@/constants/tokens';
import { useInquiry } from '@/hooks/use-api';

// 접수/답변 시각 — 서버 UTC ISO → 로컬 "YYYY.MM.DD HH:mm".
function formatDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 문의 상세 — 문의내역에서 항목 탭 시 진입(params.id). 답변은 있을 때만 표시.
export default function InquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const inquiryId = Number(id);
  const { data, isLoading, isError } = useInquiry(Number.isFinite(inquiryId) ? inquiryId : null);

  if (isLoading) {
    return (
      <Screen title="문의 상세" back>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={palette.primary} />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen title="문의 상세" back>
        <View className="flex-1 items-center justify-center">
          <AppText variant="body" className="text-muted">
            문의를 불러오지 못했어요.
          </AppText>
        </View>
      </Screen>
    );
  }

  const answered = data.status === 'ANSWERED';

  return (
    <Screen title="문의 상세" back scroll contentClassName="gap-4">
      {/* 상태 뱃지 + 제목 */}
      <View className="gap-4">
        <View
          className={`self-start rounded-pill px-3 py-1 ${answered ? 'bg-success' : 'bg-disabled'}`}
        >
          <Text className="text-[12px] font-bold text-foreground">
            {answered ? '답변완료' : '접수 완료'}
          </Text>
        </View>
        <Text className="text-[20px] font-bold leading-[26px] text-foreground">{data.title}</Text>
      </View>

      {/* 질문 본문 */}
      <Text className="text-[16px] leading-[21px] text-muted">{data.content}</Text>

      {/* 첨부 사진(있을 때만) */}
      {data.attachmentImageUrls.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {data.attachmentImageUrls.map((url, i) => (
            <Image
              key={`${url}-${i}`}
              source={{ uri: url }}
              style={{ width: 100, height: 100, borderRadius: 12 }}
              resizeMode="cover"
            />
          ))}
        </View>
      ) : null}

      {/* 접수 일시 */}
      <Text className="text-[14px] font-medium leading-[18px] text-disabled">
        {formatDate(data.createdAt)} 접수
      </Text>

      {/* 답변 카드 — 답변이 있을 때만 */}
      {data.answer ? (
        <View className="gap-3 rounded-[12px] bg-field px-4 pb-[22px] pt-4">
          <View className="self-start rounded-pill bg-popup-button px-3 py-1">
            <Text className="text-[12px] font-bold text-muted">문의답변</Text>
          </View>
          <Text className="text-[16px] leading-[21px] text-foreground">{data.answer}</Text>
          {data.answeredAt ? (
            <Text className="text-[13px] font-medium leading-[17px] text-disabled">
              {formatDate(data.answeredAt)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

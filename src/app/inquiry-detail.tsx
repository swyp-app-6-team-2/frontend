import { Text, View } from 'react-native';

import { Screen } from '@/components/ui';

// 문의 상세 — 문의내역에서 항목 탭 시 진입. 목업(스펙 예시: 답변완료 건).
export default function InquiryDetailScreen() {
  return (
    <Screen title="문의 상세" back scroll contentClassName="gap-4">
      {/* 상태 뱃지 + 제목 */}
      <View className="gap-4">
        <View className="self-start rounded-pill bg-success px-3 py-1">
          <Text className="text-[12px] font-bold text-foreground">답변완료</Text>
        </View>
        <Text className="text-[20px] font-bold leading-[26px] text-foreground">
          레시피 저장 슬롯 결제가 반영되지 않아요
        </Text>
      </View>

      {/* 질문 본문 */}
      <Text className="text-[16px] leading-[21px] text-muted">
        미디엄팩을 결제했는데 슬롯 개수가 그대로예요. 확인 부탁드려요.
      </Text>

      {/* 접수 일시 */}
      <Text className="text-[14px] font-medium leading-[18px] text-disabled">
        2026.08.16 18:45 접수
      </Text>

      {/* 답변 카드 */}
      <View className="gap-3 rounded-[12px] bg-field px-4 pb-[22px] pt-4">
        <View className="self-start rounded-pill bg-popup-button px-3 py-1">
          <Text className="text-[12px] font-bold text-muted">문의답변</Text>
        </View>
        <Text className="text-[16px] leading-[21px] text-foreground">
          안녕하세요, 별따먹자입니다. 결제 내역 확인 후 슬롯을 정상 반영해드렸어요. 이용에 불편을
          드려 죄송합니다. 🙏
        </Text>
      </View>
    </Screen>
  );
}

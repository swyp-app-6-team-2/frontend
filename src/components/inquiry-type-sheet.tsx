import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { InquiryType } from '@/lib/api/types';

import { AppText, SheetShell } from './ui';

// 코드는 백엔드 계약(types.ts)에서, 표시 이름·순서는 앱이 보유. 기타(ETC)는 항상 마지막.
export type { InquiryType };

export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  RECIPE: '레시피',
  SLOT: '별 슬롯 확장',
  ACCOUNT: '계정·로그인',
  NOTIFICATION: '알림',
  BUG: '오류 신고',
  ETC: '제안·기타',
};

export const INQUIRY_TYPE_ORDER: InquiryType[] = [
  'RECIPE',
  'SLOT',
  'ACCOUNT',
  'NOTIFICATION',
  'BUG',
  'ETC',
];

// 문의유형 선택 시트 — 문의유형 드롭다운 탭 시. 단일 선택(라디오).
export function InquiryTypeSheet({
  selected,
  onCancel,
  onApply,
}: {
  selected: InquiryType | null;
  onCancel: () => void;
  onApply: (type: InquiryType) => void;
}) {
  const [sel, setSel] = useState(selected);

  return (
    <SheetShell onCancel={onCancel} onConfirm={() => (sel ? onApply(sel) : onCancel())}>
      <AppText variant="body" className="text-foreground">
        문의유형
      </AppText>
      <View className="mb-6 mt-8 gap-1">
        {INQUIRY_TYPE_ORDER.map((type) => (
          <Pressable
            key={type}
            onPress={() => setSel(type)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel === type }}
            className="h-12 items-center justify-center active:opacity-80"
          >
            <Text
              className={`text-[16px] leading-[21px] ${
                sel === type ? 'font-semibold text-foreground' : 'text-muted'
              }`}
            >
              {INQUIRY_TYPE_LABEL[type]}
            </Text>
          </Pressable>
        ))}
      </View>
    </SheetShell>
  );
}

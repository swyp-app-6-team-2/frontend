import { Pressable, View } from 'react-native';

import { AppText } from './app-text';

export type SectionTitleProps = {
  /** Caption text (14px muted). */
  children: string;
  /** Shows a "✏️ 수정" action on the right when provided. */
  onEdit?: () => void;
};

// 작은 캡션 라벨(muted 14px) + 선택적 수정 액션. cf. Section(큰 소제목 블록).
export function SectionTitle({ children, onEdit }: SectionTitleProps) {
  return (
    <View className="flex-row items-center justify-between">
      <AppText variant="chip" className="font-semibold text-muted">
        {children}
      </AppText>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={6} accessibilityRole="button">
          <AppText variant="chip" className="text-muted">
            ✏️ 수정
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

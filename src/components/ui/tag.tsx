import { Pressable, Text, View } from 'react-native';

import { PressableScale } from './pressable-scale';

export type TagProps = {
  label: string;
  active?: boolean;
  /** Makes the whole tag pressable (e.g. toggle selection). */
  onPress?: () => void;
  /** Makes the × removable; the × glyph is always shown. */
  onRemove?: () => void;
};

// 제거 가능한 카테고리/키워드 태그 (radius 10). cf. Chip(필터 pill 토글).
export function Tag({ label, active, onPress, onRemove }: TagProps) {
  const content = (
    <View
      className={`flex-row items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 ${
        active ? 'bg-primary' : 'bg-field'
      }`}
    >
      <Text className={`text-chip font-semibold ${active ? 'text-ink' : 'text-foreground'}`}>
        {label}
      </Text>
      <Pressable
        onPress={onRemove}
        disabled={!onRemove}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`${label} 삭제`}
      >
        <Text className={`text-[13px] ${active ? 'text-ink/60' : 'text-muted'}`}>×</Text>
      </Pressable>
    </View>
  );

  // 누를 수 있는 태그만 press-scale + selection 햅틱. 안쪽 × 삭제 Pressable은
  // 별도 responder라 태그 스케일과 충돌하지 않으므로 그대로 둔다.
  return onPress ? (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      haptic="selection"
    >
      {content}
    </PressableScale>
  ) : (
    content
  );
}

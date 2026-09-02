import { Text, type PressableProps } from 'react-native';

import { PressableScale } from './pressable-scale';

export type ChipProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  active?: boolean;
};

// Figma: 칩 — pill, px16 py10, 14px.
// active: white bg / #111 text · inactive: field bg / muted text.
// press-scale + selection 햅틱(토글 피드백)은 PressableScale이 담당.
export function Chip({ label, active, className, ...rest }: ChipProps) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      haptic="selection"
      className={`rounded-pill px-4 py-2.5 ${active ? 'bg-foreground' : 'bg-field'} ${className ?? ''}`}
      {...rest}
    >
      <Text className={`text-chip ${active ? 'text-ink' : 'text-muted'}`}>{label}</Text>
    </PressableScale>
  );
}

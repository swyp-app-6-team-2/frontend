import { Pressable, Text, type PressableProps } from 'react-native';

export type ChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  active?: boolean;
};

// Figma: 칩 — pill, px16 py10, 14px.
// active: white bg / #111 text · inactive: field bg / muted text.
export function Chip({ label, active, className, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      className={`rounded-pill px-4 py-2.5 ${active ? 'bg-foreground' : 'bg-field'} ${className ?? ''}`}
      {...rest}
    >
      <Text className={`text-chip ${active ? 'text-ink' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}

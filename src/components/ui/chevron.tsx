import { Text } from 'react-native';

export type ChevronProps = {
  direction?: 'left' | 'right';
  /** Glyph size in px. Default 24 to match Figma's 24×24 chevron. */
  size?: number;
  /** Color via NativeWind, e.g. "text-muted" / "text-foreground". */
  className?: string;
};

// Directional chevron. Typographic glyph for now (no icon library yet) — swap
// for a real icon component later without touching call sites.
export function Chevron({ direction = 'right', size = 24, className }: ChevronProps) {
  return (
    <Text className={`leading-none ${className ?? ''}`} style={{ fontSize: size }}>
      {direction === 'left' ? '‹' : '›'}
    </Text>
  );
}

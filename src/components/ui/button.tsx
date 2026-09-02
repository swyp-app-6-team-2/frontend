import { Pressable, Text, View, type PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '@/hooks/use-press-scale';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Figma: 완료하기 버튼 — h52, pill, bg #FFD457, black text 16px, centered.
const container: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  // secondary/outline is inferred from the bordered buttons elsewhere in the design.
  secondary: 'border border-foreground/20 bg-transparent',
};

const labelColor: Record<ButtonVariant, string> = {
  primary: 'text-ink', // dark text on the light/gold surface
  secondary: 'text-foreground',
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  className,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  // press-scale은 공통 훅으로. primary CTA는 누를 때 가벼운 촉각 피드백.
  const press = usePressScale({ haptic: variant === 'primary' ? 'light' : undefined });

  // Keep the animated transform (inline style) and the visual styling (className)
  // on separate elements so they don't overwrite each other on the `style` prop.
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={[{ alignSelf: 'stretch' }, press.animatedStyle]}
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      {...rest}
    >
      <View
        className={`h-[52px] flex-row items-center justify-center rounded-pill px-6 ${
          disabled ? 'bg-disabled' : container[variant]
        } ${className ?? ''}`}
      >
        <Text className={`text-body font-medium ${disabled ? 'text-muted' : labelColor[variant]}`}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

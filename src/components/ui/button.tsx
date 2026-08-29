import { Pressable, Text, View, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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
  const scale = useSharedValue(1);
  // .get()/.set() (Reanimated 4) instead of `.value =` — the latter trips the
  // React Compiler immutability lint (reactCompiler is enabled in app.json).
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  // Keep the animated transform (inline style) and the visual styling (className)
  // on separate elements so they don't overwrite each other on the `style` prop.
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={[{ alignSelf: 'stretch' }, animatedStyle]}
      onPressIn={(e) => {
        scale.set(withTiming(0.96, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        // spring back with a slight overshoot → subtle "shrink then pop" feel
        scale.set(withSpring(1, { damping: 12, stiffness: 260, mass: 0.6 }));
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

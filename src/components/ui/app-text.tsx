import { Text, type TextProps } from 'react-native';

export type TextVariant = 'title' | 'subheading' | 'body' | 'chip';

// Weight is bound to the role here (Figma: title/header Bold, body Medium, chip Regular)
// so consumers get the right weight from the variant alone — no need to remember
// `font-bold`. Color defaults to foreground; override via className (last wins).
const variantClass: Record<TextVariant, string> = {
  title: 'text-title font-bold',
  subheading: 'text-subheading font-bold',
  body: 'text-body font-medium',
  chip: 'text-chip font-normal',
};

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  className?: string;
};

export function AppText({ variant = 'body', className, ...rest }: AppTextProps) {
  return (
    <Text className={`text-foreground ${variantClass[variant]} ${className ?? ''}`} {...rest} />
  );
}

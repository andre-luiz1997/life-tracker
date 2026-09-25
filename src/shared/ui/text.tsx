import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

const variants = {
  title: 'text-2xl font-bold text-foreground',
  subtitle: 'text-lg font-semibold text-foreground',
  body: 'text-base text-foreground',
  caption: 'text-sm text-muted',
} as const;

export type TextProps = RNTextProps & { variant?: keyof typeof variants };

export function Text({ variant = 'body', className, ...props }: TextProps) {
  return <RNText className={cn(variants[variant], className)} {...props} />;
}

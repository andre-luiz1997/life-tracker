import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

const variants = {
  display: 'font-body-bold text-[32px] leading-[40px] text-foreground',
  title: 'font-body-bold text-[26px] leading-[34px] text-foreground',
  subtitle: 'font-body-semibold text-lg leading-6 text-foreground',
  body: 'font-body text-base text-foreground',
  caption: 'font-body text-sm text-muted',
  label: 'font-body-medium text-[13px] text-foreground',
} as const;

export type TextProps = RNTextProps & { variant?: keyof typeof variants };

export function Text({ variant = 'body', className, ...props }: TextProps) {
  return <RNText className={cn(variants[variant], className)} {...props} />;
}

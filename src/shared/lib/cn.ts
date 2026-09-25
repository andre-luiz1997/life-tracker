import { twMerge } from 'tailwind-merge';

/**
 * Joins class names, skipping falsy values. Later classes win over conflicting earlier ones
 * (e.g. `text-muted` then `text-danger`), so components can accept style overrides.
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '));
}

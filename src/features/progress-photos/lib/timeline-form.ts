import { z } from 'zod';

export const TITLE_MAX_LENGTH = 60;

export const timelineFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'titleRequired' })
    .max(TITLE_MAX_LENGTH, { message: 'titleTooLong' }),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export type TimelineFormValues = z.infer<typeof timelineFormSchema>;

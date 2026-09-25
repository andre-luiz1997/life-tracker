import { C } from './parts';

/** How the guide figures are drawn; chosen by the user in Settings. */
export const FIGURE_GENDERS = ['feminine', 'masculine', 'neutral'] as const;
export type FigureGender = (typeof FIGURE_GENDERS)[number];

export type Build = {
  /** Half widths of the torso (small full-body figure, 200 box). */
  shoulder: number;
  waist: number;
  hip: number;
  /** Clothing. */
  top: 'sportsTop' | 'tank' | 'tee';
  bottom: 'leggings' | 'shorts';
  topColor: string;
  bottomColor: string;
  /** Head details. */
  hair: 'bun' | 'short' | 'crop';
  blush: boolean;
  brows: number;
};

export const builds: Record<FigureGender, Build> = {
  feminine: {
    shoulder: 17,
    waist: 12,
    hip: 18,
    top: 'sportsTop',
    bottom: 'leggings',
    topColor: C.top,
    bottomColor: C.pants,
    hair: 'bun',
    blush: true,
    brows: 2,
  },
  masculine: {
    shoulder: 23,
    waist: 15,
    hip: 15,
    top: 'tank',
    bottom: 'shorts',
    topColor: C.top,
    bottomColor: C.blue,
    hair: 'short',
    blush: false,
    brows: 3,
  },
  neutral: {
    shoulder: 19,
    waist: 14,
    hip: 16,
    top: 'tee',
    bottom: 'shorts',
    topColor: C.top,
    bottomColor: C.mint,
    hair: 'crop',
    blush: true,
    brows: 2.4,
  },
};

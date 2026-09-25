import { appSettings, getDatabase, readSetting, useDbQuery, writeSetting } from '@/core/db';

import { FIGURE_GENDERS, type FigureGender } from '../templates/illustrations';

const KEY = 'photos.figureGender';
export const DEFAULT_FIGURE_GENDER: FigureGender = 'neutral';

export function readFigureGender(): FigureGender {
  const value = readSetting<string>(getDatabase(), KEY, DEFAULT_FIGURE_GENDER);
  return (FIGURE_GENDERS as readonly string[]).includes(value)
    ? (value as FigureGender)
    : DEFAULT_FIGURE_GENDER;
}

export function setFigureGender(gender: FigureGender) {
  writeSetting(getDatabase(), KEY, gender);
}

/** Style of the pose-guide figures (Settings → Guide figures). */
export function useFigureGender(): FigureGender {
  return useDbQuery(readFigureGender, [appSettings]).data ?? DEFAULT_FIGURE_GENDER;
}

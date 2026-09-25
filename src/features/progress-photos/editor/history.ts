import { applyEdit, type EditAction, type EditState, type Size } from './edit-state';

const MAX_HISTORY = 50;

export type History = { past: EditState[]; present: EditState };

export type HistoryAction =
  /** Discrete edit (button): recorded as its own undo step. */
  | { type: 'apply'; action: EditAction; image: Size }
  /** Continuous edit (gesture/slider frame): updates the present without a new step. */
  | { type: 'preview'; action: EditAction; image: Size }
  /** Start of a gesture/slider drag: saves the current state as one undo step. */
  | { type: 'checkpoint' }
  | { type: 'undo' };

const push = (past: EditState[], state: EditState) => [...past, state].slice(-MAX_HISTORY);

export function historyReducer(history: History, action: HistoryAction): History {
  switch (action.type) {
    case 'apply': {
      const next = applyEdit(history.present, action.action, action.image);
      return next === history.present
        ? history
        : { past: push(history.past, history.present), present: next };
    }
    case 'preview':
      return { ...history, present: applyEdit(history.present, action.action, action.image) };
    case 'checkpoint':
      return { ...history, past: push(history.past, history.present) };
    case 'undo': {
      const previous = history.past.at(-1);
      return previous ? { past: history.past.slice(0, -1), present: previous } : history;
    }
  }
}

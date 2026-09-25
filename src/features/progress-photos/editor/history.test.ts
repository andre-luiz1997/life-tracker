import { initialEditState } from './edit-state';
import { type History, historyReducer } from './history';

const image = { width: 3000, height: 4000 };
const start = (): History => ({ past: [], present: initialEditState(image, '3:4') });

describe('historyReducer', () => {
  it('records discrete edits and undoes them', () => {
    let h = historyReducer(start(), { type: 'apply', action: { type: 'rotate' }, image });
    h = historyReducer(h, { type: 'apply', action: { type: 'flip' }, image });
    expect(h.past).toHaveLength(2);
    h = historyReducer(h, { type: 'undo' });
    expect(h.present.flipH).toBe(false);
    expect(h.present.rotation).toBe(90);
    h = historyReducer(historyReducer(h, { type: 'undo' }), { type: 'undo' });
    expect(h.present.rotation).toBe(0);
    expect(h.past).toHaveLength(0);
  });

  it('collapses a gesture into a single undo step', () => {
    let h = historyReducer(start(), { type: 'checkpoint' });
    for (let i = 1; i <= 10; i++) {
      h = historyReducer(h, {
        type: 'preview',
        action: { type: 'setBrightness', value: i / 10 },
        image,
      });
    }
    expect(h.present.brightness).toBe(1);
    expect(h.past).toHaveLength(1);
    expect(historyReducer(h, { type: 'undo' }).present.brightness).toBe(0);
  });

  it('skips no-op edits and caps history', () => {
    const tiny = { id: 't', kind: 'solid' as const, x: 0, y: 0, w: 0, h: 0 };
    expect(
      historyReducer(start(), { type: 'apply', action: { type: 'addCensor', censor: tiny }, image })
        .past,
    ).toHaveLength(0);
    let h = start();
    for (let i = 0; i < 80; i++)
      h = historyReducer(h, { type: 'apply', action: { type: 'flip' }, image });
    expect(h.past).toHaveLength(50);
  });
});

import { act, renderHook } from '@testing-library/react-native';

import { useCountdown } from './use-countdown';

describe('useCountdown', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('ticks every second and finishes at zero', async () => {
    const onTick = jest.fn();
    const onDone = jest.fn();
    const { result } = await renderHook(() => useCountdown({ onTick, onDone }));

    await act(async () => result.current.start(3));
    expect(result.current.remaining).toBe(3);
    expect(onTick).toHaveBeenLastCalledWith(3);

    await act(async () => jest.advanceTimersByTime(2000));
    expect(result.current.remaining).toBe(1);
    expect(onTick.mock.calls.map(([n]) => n)).toEqual([3, 2, 1]);
    expect(onDone).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(1000));
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(result.current.remaining).toBeNull();
  });

  it('can be cancelled', async () => {
    const onDone = jest.fn();
    const { result } = await renderHook(() => useCountdown({ onDone }));
    await act(async () => result.current.start(5));
    await act(async () => result.current.cancel());
    await act(async () => jest.advanceTimersByTime(10_000));
    expect(onDone).not.toHaveBeenCalled();
    expect(result.current.remaining).toBeNull();
  });
});

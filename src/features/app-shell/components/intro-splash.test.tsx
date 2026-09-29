import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { INTRO_DURATION, IntroSplash } from './intro-splash';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

const layout = { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } } };

describe('IntroSplash', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('takes over from the native splash, shows the tagline and finishes', async () => {
    const onDone = jest.fn();
    await render(<IntroSplash onDone={onDone} />);
    expect(screen.getByText('Transforme o tempo em resultados')).toBeOnTheScreen();
    expect(screen.getByRole('image', { name: 'KRONOS' })).toBeOnTheScreen();

    // Nothing runs until the view is on screen (the native splash is still covering it).
    await act(() => jest.advanceTimersByTime(INTRO_DURATION));
    expect(onDone).not.toHaveBeenCalled();

    await fireEvent(screen.getByTestId('intro-splash'), 'layout', layout);
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    await act(() => jest.advanceTimersByTime(INTRO_DURATION - 1));
    expect(onDone).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(1));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

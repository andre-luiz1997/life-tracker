import { fireEvent, render, screen } from '@testing-library/react-native';

import { ContextMenu } from './context-menu';

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-font', () => ({ useFonts: () => [true] }));
jest.mock('expo-symbols/androidWeights/regular', () => ({ name: 'M', font: 1 }));

describe('ContextMenu', () => {
  it('runs the chosen action and closes', async () => {
    const onClose = jest.fn();
    const archive = jest.fn();
    await render(
      <ContextMenu
        anchor={{ x: 100, y: 100 }}
        title="Meu cabelo"
        closeLabel="Fechar"
        onClose={onClose}
        items={[
          { label: 'Arquivar', icon: 'archive', onPress: archive },
          { label: 'Excluir', icon: 'trash', onPress: jest.fn(), destructive: true },
        ]}
      />,
    );
    expect(screen.getByText('Meu cabelo')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Arquivar' }));
    expect(archive).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when tapping outside', async () => {
    const onClose = jest.fn();
    await render(
      <ContextMenu anchor={{ x: 0, y: 0 }} closeLabel="Fechar" onClose={onClose} items={[]} />,
    );
    // The backdrop is hidden from screen readers while the menu is modal (they dismiss with
    // the platform gesture), so query it including hidden elements.
    await fireEvent.press(
      screen.getByRole('button', { name: 'Fechar', includeHiddenElements: true }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing without an anchor', async () => {
    await render(<ContextMenu anchor={null} closeLabel="Fechar" onClose={jest.fn()} items={[]} />);
    expect(
      screen.queryByRole('button', { name: 'Fechar', includeHiddenElements: true }),
    ).toBeNull();
  });
});

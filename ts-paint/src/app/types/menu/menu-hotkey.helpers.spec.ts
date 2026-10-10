import { findMenuActionTypeByHotkeyEvent } from './menu-hotkey.helpers';
import { MenuActionType } from './menu-action-type';
import { MenuItem } from './menu-item';
import { MENU_STRUCTURE, NON_MENU_SHORTCUTS } from '../../services/ts-paint/ts-paint.config';

const TEST_MENU: MenuItem[] = [
  {
    name: 'File',
    menus: [
      { name: 'New', hotkeys: ['Ctrl', 'N'], action: MenuActionType.NEW },
      {},
      {
        name: 'More',
        menus: [{ name: 'Crop', hotkeys: ['Alt', 'Shift', 'C'], action: MenuActionType.CROP }],
      },
    ],
  },
  {
    name: 'Edit',
    menus: [
      { name: 'Clear', hotkeys: ['Delete'], action: MenuActionType.CLEAR_SELECTION },
      { name: 'Scrambled', hotkeys: ['X', 'Shift', 'Ctrl'], action: MenuActionType.CUT },
      { name: 'Paste', hotkeys: ['Ctrl', 'V'], disabled: true },
    ],
  },
];

function keyEvent(key: string, modifiers: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ...modifiers });
}

describe('findMenuActionTypeByHotkeyEvent', () => {
  it('finds a top level item by its hotkeys', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('N', { ctrlKey: true }))).toBe(MenuActionType.NEW);
  });

  it('uppercases single character keys', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('n', { ctrlKey: true }))).toBe(MenuActionType.NEW);
  });

  it('treats Meta like Ctrl', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('n', { metaKey: true }))).toBe(MenuActionType.NEW);
  });

  it('matches named keys without modifiers', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('Delete'))).toBe(MenuActionType.CLEAR_SELECTION);
  });

  it('recurses into submenus', () => {
    const event: KeyboardEvent = keyEvent('c', { altKey: true, shiftKey: true });
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, event)).toBe(MenuActionType.CROP);
  });

  it('ignores the order in which the hotkeys are declared', () => {
    const event: KeyboardEvent = keyEvent('x', { ctrlKey: true, shiftKey: true });
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, event)).toBe(MenuActionType.CUT);
  });

  it('requires exactly the declared modifiers', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('n'))).toBeUndefined();
    expect(
      findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('n', { ctrlKey: true, shiftKey: true }))
    ).toBeUndefined();
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('Delete', { ctrlKey: true }))).toBeUndefined();
  });

  it('matches nothing for a bare modifier key', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('Control', { ctrlKey: true }))).toBeUndefined();
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('Shift', { shiftKey: true }))).toBeUndefined();
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('Alt', { altKey: true }))).toBeUndefined();
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('Meta', { metaKey: true }))).toBeUndefined();
  });

  it('matches nothing for an item that has hotkeys but no action', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('v', { ctrlKey: true }))).toBeUndefined();
  });

  it('matches nothing for a key that is not a hotkey', () => {
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('q', { ctrlKey: true }))).toBeUndefined();
    expect(findMenuActionTypeByHotkeyEvent(TEST_MENU, keyEvent('F5'))).toBeUndefined();
  });

  it('matches nothing in an empty menu', () => {
    expect(findMenuActionTypeByHotkeyEvent([], keyEvent('n', { ctrlKey: true }))).toBeUndefined();
  });

  describe('with the real menu', () => {
    it('resolves the standard shortcuts', () => {
      expect(findMenuActionTypeByHotkeyEvent(MENU_STRUCTURE, keyEvent('z', { ctrlKey: true }))).toBe(
        MenuActionType.UNDO
      );
      expect(findMenuActionTypeByHotkeyEvent(MENU_STRUCTURE, keyEvent('s', { metaKey: true }))).toBe(
        MenuActionType.SAVE_FILE
      );
      expect(findMenuActionTypeByHotkeyEvent(MENU_STRUCTURE, keyEvent('Delete'))).toBe(MenuActionType.CLEAR_SELECTION);
    });

    it('matches nothing for Ctrl+V because Paste is handled by the paste event', () => {
      expect(findMenuActionTypeByHotkeyEvent(MENU_STRUCTURE, keyEvent('v', { ctrlKey: true }))).toBeUndefined();
    });

    it('matches nothing for Ctrl+Shift+Z', () => {
      const event: KeyboardEvent = keyEvent('z', { ctrlKey: true, shiftKey: true });
      expect(findMenuActionTypeByHotkeyEvent(MENU_STRUCTURE, event)).toBeUndefined();
    });

    it('resolves Escape to DESELECT through the non-menu shortcuts', () => {
      expect(findMenuActionTypeByHotkeyEvent(MENU_STRUCTURE, keyEvent('Escape'))).toBeUndefined();
      expect(findMenuActionTypeByHotkeyEvent(NON_MENU_SHORTCUTS, keyEvent('Escape'))).toBe(MenuActionType.DESELECT);
    });
  });
});

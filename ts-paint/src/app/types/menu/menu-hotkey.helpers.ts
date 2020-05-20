import { MenuActionType } from './menu-action-type';
import { MenuItem } from './menu-item';
import { isEmpty } from 'src/app/helpers/typescript.helpers';
import { isDefined } from '@angular/compiler/src/util';

export function findMenuActionTypeByHotkeyEvent(menu: MenuItem[], event: KeyboardEvent): MenuActionType | undefined {
  return findMenuActionTypeByHotkeys(menu, getEventHotkeys(event));
}

function getEventHotkeys(event: KeyboardEvent): string[] {
  const hotkeys: string[] = [];
  if (event.altKey) {
    hotkeys.push('Alt');
  }
  if (event.ctrlKey) {
    hotkeys.push('Ctrl');
  }
  if (event.shiftKey) {
    hotkeys.push('Shift');
  }

  const pressedKey: string = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  if (!['Alt', 'Control', 'Shift'].includes(pressedKey)) {
    hotkeys.push(pressedKey);
  }

  return hotkeys;
}

function findMenuActionTypeByHotkeys(menu: MenuItem[], hotkeys: string[]): MenuActionType | undefined {
  for (const menuItem of menu) {
    const actionType: MenuActionType = findMenuItemActionByHotkeys(menuItem, hotkeys);
    if (isDefined(actionType)) {
      return actionType;
    }
  }
}

function findMenuItemActionByHotkeys(menuItem: MenuItem, hotkeys: string[]): MenuActionType | undefined {
  if (hotkeysMatch(menuItem.hotkeys, hotkeys)) {
    return menuItem.action;
  } else if (!isEmpty(menuItem.menus)) {
    return findMenuActionTypeByHotkeys(menuItem.menus, hotkeys);
  }
}

function hotkeysMatch(hotkeys: string[], eventHotkeys: string[]): boolean {
  if (isEmpty(hotkeys) || isEmpty(eventHotkeys) || hotkeys.length !== eventHotkeys.length) {
    return false;
  }

  return new Set([...hotkeys, ...eventHotkeys]).size === hotkeys.length;
}

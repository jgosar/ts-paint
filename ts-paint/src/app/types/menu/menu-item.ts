import { MenuActionType } from './menu-action-type';

export interface MenuItem {
  name?: string;
  disabled?: boolean;
  /** Shows a check mark in front of the name */
  checked?: boolean;
  hotkeys?: string[];
  action?: MenuActionType;
  menus?: MenuItem[];
}

import { MenuActionType } from './menu-action-type';

export interface MenuItem {
  name?: string;
  disabled?: boolean;
  hotkeys?: string[];
  action?: MenuActionType;
  menus?: MenuItem[];
}

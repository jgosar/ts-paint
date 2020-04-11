import { MenuAction } from "./menu-action";

export interface MenuItem {
  name?: string;
  disabled?: boolean;
  hotkeys?: string;
  action?: MenuAction;
  menus?: MenuItem[];
}

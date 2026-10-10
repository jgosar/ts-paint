import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { MENU_STRUCTURE } from '../src/app/services/ts-paint/ts-paint.config';

test.describe('menus', () => {
  for (const menu of MENU_STRUCTURE) {
    test(`${menu.name} menu open`, async ({ page }) => {
      const paint = new PaintPage(page);
      await paint.goto();
      await paint.openMenu(menu.name);
      await expect(page).toHaveScreenshot(`menu-${menu.name.toLowerCase()}.png`, {
        clip: { x: 0, y: 0, width: 400, height: 300 },
      });
    });
  }
});

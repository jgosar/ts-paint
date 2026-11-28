import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { MENU_STRUCTURE } from '../src/app/services/ts-paint/ts-paint.config';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';

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

  test('View > Zoom submenu open, before and after the grid is switched on', async ({ page }) => {
    const paint = new PaintPage(page);
    await paint.goto();
    const view = await paint.openMenu('View');
    await paint.openSubmenu(view, 'Zoom');
    await expect(page).toHaveScreenshot('menu-view-zoom.png', { clip: { x: 0, y: 0, width: 400, height: 300 } });

    await paint.selectTool(DrawingToolType.magnifier);
    await paint.clickCanvas(0, 0);
    await paint.clickCanvas(0, 0);
    await paint.hotkey('Control+g');
    await paint.openMenu('View');
    const zoom = await paint.openSubmenu(view, 'Zoom');
    await paint.submenuItem(zoom, 'Show Grid').hover();
    await expect(page).toHaveScreenshot('menu-view-zoom-grid.png', { clip: { x: 0, y: 0, width: 400, height: 300 } });
  });
});

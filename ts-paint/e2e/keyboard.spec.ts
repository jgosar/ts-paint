import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, WHITE } from './helpers/pixels';
import { removeFileSystemAccess } from './helpers/files';
import { MENU_STRUCTURE } from '../src/app/services/ts-paint/ts-paint.config';

test.describe('keyboard shortcuts', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
  });

  test('every enabled menu item with a hotkey shows it in the menu', async () => {
    for (const menu of MENU_STRUCTURE) {
      const opened = await paint.openMenu(menu.name);
      for (const item of menu.menus.filter((entry) => entry.name && entry.hotkeys && !entry.disabled)) {
        await expect(paint.menuItem(opened, item.name)).toContainText(item.hotkeys.join('+'));
      }
      await paint.page.keyboard.press('Escape');
    }
  });

  test('Ctrl+I, Ctrl+R and Escape reach their actions', async ({ page }) => {
    await paint.hotkey('Control+i');
    await expectPixel(page, 10, 10, BLACK);
    await paint.hotkey('Control+r');
    const window = paint.window('tsp-flip-rotate-window');
    await expect(window).toBeVisible();
    // Escape closes a dialog when the keyboard focus is inside it
    await window.getByRole('button', { name: 'OK' }).press('Escape');
    await expect(window).toBeHidden();
  });

  test('typing in the Save As name field does not trigger app shortcuts', async ({ page }) => {
    await removeFileSystemAccess(page);
    await paint.goto(); // init scripts only apply from the next navigation on
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(10, 10);
    await paint.menu('File', 'Save As');
    const window = paint.window('tsp-save-as-window');
    const nameInput = window.locator('tsp-text-input input');
    await nameInput.fill('drawing');
    await nameInput.press('Home');
    await nameInput.press('Delete');
    await expect(nameInput).toHaveValue('rawing');
    await nameInput.press('Control+a');
    await expect(paint.selectionFrame).toBeHidden();
    await nameInput.press('Escape');
    await expectPixel(page, 10, 10, BLACK);
    void WHITE;
  });
});

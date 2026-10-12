import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';

test.describe('dialog windows', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
  });

  test('Attributes', async () => {
    await paint.menu('Image', 'Attributes');
    await expect(paint.window('tsp-attributes-window')).toHaveScreenshot('window-attributes.png');
  });

  test('Flip and Rotate', async () => {
    await paint.menu('Image', 'Flip/Rotate');
    await expect(paint.window('tsp-flip-rotate-window')).toHaveScreenshot('window-flip-rotate.png');
  });

  test('Flip and Rotate with the angles enabled', async () => {
    await paint.menu('Image', 'Flip/Rotate');
    await paint.chooseRadio(paint.window('tsp-flip-rotate-window'), 'Rotate by angle');
    await expect(paint.window('tsp-flip-rotate-window')).toHaveScreenshot('window-flip-rotate-angles.png');
  });

  test('Stretch and Skew', async () => {
    await paint.menu('Image', 'Stretch/Skew');
    await expect(paint.window('tsp-stretch-skew-window')).toHaveScreenshot('window-stretch-skew.png');
  });

  test('About Paint', async () => {
    await paint.menu('Help', 'About Paint');
    await expect(paint.window('tsp-about-paint-window')).toHaveScreenshot('window-about.png');
  });

  test('Save As, with the format list open', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).showSaveFilePicker = undefined;
      (window as any).showOpenFilePicker = undefined;
    });
    await paint.goto();
    await paint.menu('File', 'Save As');
    const window = paint.window('tsp-save-as-window');
    await expect(window).toHaveScreenshot('window-save-as.png');
    await window.locator('tsp-dropdown').click();
    // The open list hangs below the window, so capture the union of both boxes
    const list = window.locator('.tsp-dropdown__list-container');
    await expect(list).toBeVisible();
    const boxes = [await window.boundingBox(), await list.boundingBox()];
    const left = Math.floor(Math.min(...boxes.map((b) => b.x)));
    const top = Math.floor(Math.min(...boxes.map((b) => b.y)));
    const right = Math.ceil(Math.max(...boxes.map((b) => b.x + b.width)));
    const bottom = Math.ceil(Math.max(...boxes.map((b) => b.y + b.height)));
    await expect(page).toHaveScreenshot('window-save-as-formats.png', {
      clip: { x: left, y: top, width: right - left, height: bottom - top },
    });
  });
});

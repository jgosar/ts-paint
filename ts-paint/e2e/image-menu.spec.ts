import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, imageSize, RED, WHITE } from './helpers/pixels';

const RED_SWATCH: number = 5;

test.describe('Image menu', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(5, 5);
  });

  test('Attributes grows the image with the secondary color and shrinks it by cropping', async ({ page }) => {
    await paint.setSecondaryColor(RED_SWATCH);
    await paint.menu('Image', 'Attributes');
    const window = paint.window('tsp-attributes-window');
    await expect(window).toBeVisible();
    await paint.setIntegerInput(window, 'Width', '400');
    await paint.setIntegerInput(window, 'Height', '300');
    await paint.clickButton(window, 'OK');
    await expect(window).toBeHidden();
    expect(await imageSize(page)).toEqual({ width: 400, height: 300 });
    await expectPixel(page, 350, 250, RED);
    await expectPixel(page, 5, 5, BLACK);

    await paint.menu('Image', 'Attributes');
    await paint.setIntegerInput(window, 'Width', '100');
    await paint.setIntegerInput(window, 'Height', '50');
    await window.locator('input').first().press('Enter');
    expect(await imageSize(page)).toEqual({ width: 100, height: 50 });
    await expectPixel(page, 5, 5, BLACK);
  });

  test('Attributes can be cancelled with Escape', async ({ page }) => {
    await paint.menu('Image', 'Attributes');
    const window = paint.window('tsp-attributes-window');
    await paint.setIntegerInput(window, 'Width', '50');
    await window.locator('input').first().press('Escape');
    await expect(window).toBeHidden();
    expect(await imageSize(page)).toEqual({ width: 300, height: 200 });
  });

  test('Flip horizontal mirrors the image', async ({ page }) => {
    await paint.hotkey('Control+r');
    const window = paint.window('tsp-flip-rotate-window');
    await expect(window).toBeVisible();
    await paint.clickButton(window, 'OK');
    await expectPixel(page, 294, 5, BLACK);
    await expectPixel(page, 5, 5, WHITE);
  });

  test('Flip vertical mirrors the image', async ({ page }) => {
    await paint.menu('Image', 'Flip/Rotate');
    const window = paint.window('tsp-flip-rotate-window');
    await paint.chooseRadio(window, 'Flip vertical');
    await paint.clickButton(window, 'OK');
    await expectPixel(page, 5, 194, BLACK);
    await expectPixel(page, 5, 5, WHITE);
  });

  test('Rotate by 90° swaps the dimensions', async ({ page }) => {
    await paint.menu('Image', 'Flip/Rotate');
    const window = paint.window('tsp-flip-rotate-window');
    await expect(window.getByLabel('90°')).toBeDisabled();
    await paint.chooseRadio(window, 'Rotate by angle');
    await expect(window.getByLabel('90°')).toBeEnabled();
    await paint.clickButton(window, 'OK');
    expect(await imageSize(page)).toEqual({ width: 200, height: 300 });
    await expectPixel(page, 194, 5, BLACK);
    await paint.hotkey('Control+z');
    expect(await imageSize(page)).toEqual({ width: 300, height: 200 });
    await expectPixel(page, 5, 5, BLACK);
  });

  test('Stretch scales the image without smoothing', async ({ page }) => {
    await paint.menu('Image', 'Stretch/Skew');
    const window = paint.window('tsp-stretch-skew-window');
    await paint.setIntegerInput(window, 'Horizontal', '200');
    await paint.setIntegerInput(window, 'Vertical', '200');
    await paint.clickButton(window, 'OK');
    expect(await imageSize(page)).toEqual({ width: 600, height: 400 });
    await expectPixel(page, 10, 10, BLACK);
    await expectPixel(page, 11, 11, BLACK);
    await expectPixel(page, 12, 12, WHITE);
    await expectPixel(page, 9, 9, WHITE);
  });

  test('Invert Colors inverts every pixel', async ({ page }) => {
    await paint.hotkey('Control+i');
    await expectPixel(page, 5, 5, WHITE);
    await expectPixel(page, 100, 100, BLACK);
  });

  test('Clear Image fills everything with the secondary color', async ({ page }) => {
    await paint.setSecondaryColor(RED_SWATCH);
    await paint.menu('Image', 'Clear Image');
    await expectPixel(page, 5, 5, RED);
    await expectPixel(page, 299, 199, RED);
  });

  test('About shows the operating system and closes with OK', async () => {
    await paint.menu('Help', 'About Paint');
    const window = paint.window('tsp-about-paint-window');
    await expect(window).toContainText('Windows 10');
    await paint.clickButton(window, 'OK');
    await expect(window).toBeHidden();
  });

  test('disabled menu items do nothing', async ({ page }) => {
    const view = await paint.openMenu('View');
    const zoom = view.locator('.tsp-menu__menu-level-2').first();
    await expect(zoom).toHaveClass(/--disabled/);
    await zoom.click();
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(50, 50);
    await expectPixel(page, 50, 50, BLACK);
  });
});

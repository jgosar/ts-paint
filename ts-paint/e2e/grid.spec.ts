import { expect, Locator, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, Rgb, screenMask, WHITE } from './helpers/pixels';

/** The two greys the grid lines are checkered with, and the colors of the image under them */
const LEGEND: { [character: string]: Rgb } = {
  D: { r: 134, g: 138, b: 142 },
  L: { r: 195, g: 199, b: 203 },
  '.': WHITE,
  '#': BLACK,
};

test.describe('pixel grid', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
  });

  /** Doubles the zoom the given number of times, staying scrolled to the top left corner of the image */
  async function zoomIn(times: number): Promise<void> {
    await paint.selectTool(DrawingToolType.magnifier);
    for (let i = 0; i < times; i++) {
      await paint.clickCanvas(0, 0);
    }
  }

  async function zoomOut(): Promise<void> {
    await paint.selectTool(DrawingToolType.magnifier);
    await paint.clickCanvas(0, 0, 'right');
  }

  async function showGridItem(): Promise<Locator> {
    const view: Locator = await paint.openMenu('View');
    const zoom: Locator = await paint.openSubmenu(view, 'Zoom');
    return paint.submenuItem(zoom, 'Show Grid');
  }

  /** The screen from the top left corner of the image, `width` x `height` screen pixels */
  async function screenAtImageOrigin(width: number, height: number): Promise<string[]> {
    const box = await paint.canvasTracker.boundingBox();
    return screenMask(paint.page, { x: box.x, y: box.y, width, height }, LEGEND);
  }

  test('View > Zoom > Show Grid is greyed out until the image is zoomed to 400%', async () => {
    await expect(await showGridItem()).toHaveClass(/--disabled/);
    await (await showGridItem()).click();
    await expect(paint.pixelGrid).toHaveCount(0);

    await zoomIn(1);
    await expect(await showGridItem()).toHaveClass(/--disabled/);

    await zoomIn(1);
    await expect(await showGridItem()).not.toHaveClass(/--disabled/);
    await expect(await showGridItem()).toHaveAttribute('aria-checked', 'false');
    await expect(await showGridItem()).toContainText('Ctrl+G');
  });

  test('Show Grid draws a checkered line along the top and left edge of every pixel, and ticks the menu item', async () => {
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(1, 1);
    await zoomIn(2);
    await (await showGridItem()).click();

    await expect(paint.pixelGrid).toBeVisible();
    await expect(await showGridItem()).toHaveAttribute('aria-checked', 'true');
    await paint.selectTool(DrawingToolType.pencil); // moves the pointer, and with it the menu, off the image
    expect(await screenAtImageOrigin(13, 9)).toEqual([
      'DLDLDLDLDLDLD',
      'L...L...L...L',
      'D...D...D...D',
      'L...L...L...L',
      'DLDLDLDLDLDLD',
      'L...L###L...L',
      'D...D###D...D',
      'L...L###L...L',
      'DLDLDLDLDLDLD',
    ]);
  });

  test('the lines stay one pixel thick at higher zooms', async () => {
    await zoomIn(4);
    await paint.hotkey('Control+g');
    await paint.selectTool(DrawingToolType.pencil);

    const rows: string[] = await screenAtImageOrigin(33, 18);
    expect(rows[0]).toBe('DLDLDLDLDLDLDLDLDLDLDLDLDLDLDLDLD');
    expect(rows[1]).toBe('L' + '.'.repeat(15) + 'L' + '.'.repeat(15) + 'L');
    expect(rows[2]).toBe('D' + '.'.repeat(15) + 'D' + '.'.repeat(15) + 'D');
    expect(rows[15]).toBe('L' + '.'.repeat(15) + 'L' + '.'.repeat(15) + 'L');
    expect(rows[16]).toBe('DLDLDLDLDLDLDLDLDLDLDLDLDLDLDLDLD');
    expect(rows[17]).toBe('L' + '.'.repeat(15) + 'L' + '.'.repeat(15) + 'L');
  });

  test('the grid is closed on the right and at the bottom of the image', async () => {
    await paint.menu('Image', 'Attributes');
    const window = paint.window('tsp-attributes-window');
    await paint.setIntegerInput(window, 'Width', '3');
    await paint.setIntegerInput(window, 'Height', '2');
    await paint.clickButton(window, 'OK');
    await zoomIn(2);
    await paint.hotkey('Control+g');
    await paint.selectTool(DrawingToolType.pencil);

    // The window behind the image has the dark grey of the grid
    expect(await screenAtImageOrigin(15, 11)).toEqual([
      'DLDLDLDLDLDLDDD',
      'L...L...L...LDD',
      'D...D...D...DDD',
      'L...L...L...LDD',
      'DLDLDLDLDLDLDDD',
      'L...L...L...LDD',
      'D...D...D...DDD',
      'L...L...L...LDD',
      'DLDLDLDLDLDLDDD',
      'DDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDD',
    ]);
  });

  test('Ctrl+G shows and hides the grid', async () => {
    await zoomIn(2);
    await paint.hotkey('Control+g');
    await expect(paint.pixelGrid).toBeVisible();
    await paint.hotkey('Control+g');
    await expect(paint.pixelGrid).toHaveCount(0);
  });

  test('zooming out below 400% hides the grid, zooming back in brings it back', async () => {
    await zoomIn(2);
    await paint.hotkey('Control+g');
    await zoomOut();
    await expect(paint.pixelGrid).toHaveCount(0);
    await expect(await showGridItem()).toHaveClass(/--disabled/);
    await expect(await showGridItem()).toHaveAttribute('aria-checked', 'false');

    await zoomIn(2);
    await expect(paint.pixelGrid).toBeVisible();
    await expect(paint.pixelGrid).toHaveCSS('width', `${300 * 8 + 1}px`);
  });

  test('the tools draw through the grid', async ({ page }) => {
    await zoomIn(2);
    await paint.hotkey('Control+g');
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(3, 2);
    await expectPixel(page, 3, 2, BLACK);
    await expectPixel(page, 4, 2, WHITE);
  });
});

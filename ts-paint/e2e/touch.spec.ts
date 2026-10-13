import { expect, Locator, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, expectPixels, imageCanvas, imageMask, WHITE } from './helpers/pixels';
import { ScreenPoint, Touchscreen } from './helpers/touch';

test.use({ hasTouch: true });

test.describe('touchscreen', () => {
  let paint: PaintPage;
  let touch: Touchscreen;
  let scroller: Locator;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    touch = await Touchscreen.create(page);
    scroller = page.locator('tsp-image-scroller');
    await paint.goto();
  });

  /** Zooms in twice with the magnifier, so that the image (300x200 at 4x) is bigger than the viewport and scrolls */
  async function zoomInUntilScrollable(): Promise<void> {
    await paint.selectTool(DrawingToolType.magnifier);
    await paint.clickCanvas(150, 100);
    await paint.clickCanvas(150, 100);
    await expect(imageCanvas(paint.page)).toHaveCSS('width', '1200px');
  }

  async function scrollPosition(): Promise<ScreenPoint> {
    return scroller.evaluate((element: HTMLElement) => ({ x: element.scrollLeft, y: element.scrollTop }));
  }

  test('one finger scrolls the image and paints nothing', async ({ page }) => {
    await zoomInUntilScrollable();
    await paint.selectTool(DrawingToolType.pencil);
    const before: ScreenPoint = await scrollPosition();

    const from: ScreenPoint = await paint.canvasPoint(150, 100);
    await touch.drag(from, { x: from.x - 80, y: from.y - 60 });

    await expect.poll(scrollPosition).not.toEqual(before);
    expect(await imageMask(page, { w: 0, h: 0, width: 300, height: 200 })).toEqual(
      Array(200).fill('.'.repeat(300))
    );
  });

  test('a tap followed by a drag draws with the pencil instead of scrolling', async ({ page }) => {
    await zoomInUntilScrollable();
    await paint.selectTool(DrawingToolType.pencil);
    const before: ScreenPoint = await scrollPosition();

    const from: ScreenPoint = await paint.canvasPoint(100, 100);
    await touch.tap(from);
    await touch.drag(from, await paint.canvasPoint(140, 100));

    await expectPixels(page, BLACK, [
      [100, 100],
      [120, 100],
      [140, 100],
    ]);
    await expectPixel(page, 120, 101, WHITE);
    expect(await scrollPosition()).toEqual(before);
  });

  test('a tap on its own is a click once the drag window has passed', async ({ page }) => {
    await paint.selectTool(DrawingToolType.pencil);
    await touch.tap(await paint.canvasPoint(10, 10));
    await expect.poll(() => imageMask(page, { w: 9, h: 9, width: 3, height: 3 })).toEqual(['...', '.#.', '...']);

    await paint.selectTool(DrawingToolType.colorFiller);
    await touch.tap(await paint.canvasPoint(200, 150));
    await expect.poll(() => imageMask(page, { w: 0, h: 0, width: 3, height: 1 })).toEqual(['###']);
  });

  test('two fingers zoom in and out by 2x steps without zooming the page', async ({ page }) => {
    const canvas: Locator = imageCanvas(page);
    const centre: ScreenPoint = await paint.canvasPoint(150, 100);

    await touch.pinch(centre, 100, 200);
    await expect(canvas).toHaveCSS('width', '600px');
    await touch.pinch(centre, 200, 100);
    await expect(canvas).toHaveCSS('width', '300px');
    await touch.pinch(centre, 200, 100);
    await expect(canvas).toHaveCSS('width', '150px');

    expect(await page.evaluate(() => window.visualViewport.scale)).toBe(1);
  });
});

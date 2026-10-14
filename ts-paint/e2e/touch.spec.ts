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

  /** The middle of the visible part of the image */
  async function viewportCentre(): Promise<ScreenPoint> {
    const box = await scroller.boundingBox();
    return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  }

  /** The image point (not rounded to a pixel) under a point on the screen */
  async function imagePointUnder(point: ScreenPoint): Promise<{ w: number; h: number }> {
    const box = await imageCanvas(paint.page).boundingBox();
    const zoom: number = box.width / 300;
    return { w: (point.x - box.x) / zoom, h: (point.y - box.y) / zoom };
  }

  test('one finger draws with the pencil and does not scroll', async ({ page }) => {
    await zoomInUntilScrollable();
    await paint.selectTool(DrawingToolType.pencil);
    const before: ScreenPoint = await scrollPosition();

    await touch.drag(await paint.canvasPoint(100, 100), await paint.canvasPoint(140, 100));

    await expectPixels(page, BLACK, [
      [100, 100],
      [120, 100],
      [140, 100],
    ]);
    await expectPixel(page, 120, 101, WHITE);
    expect(await scrollPosition()).toEqual(before);
  });

  test('a tap is a click', async ({ page }) => {
    await paint.selectTool(DrawingToolType.pencil);
    await touch.tap(await paint.canvasPoint(10, 10));
    await expect.poll(() => imageMask(page, { w: 9, h: 9, width: 3, height: 3 })).toEqual(['...', '.#.', '...']);

    await paint.selectTool(DrawingToolType.colorFiller);
    await touch.tap(await paint.canvasPoint(200, 150));
    await expect.poll(() => imageMask(page, { w: 0, h: 0, width: 3, height: 1 })).toEqual(['###']);
  });

  test('two fingers scroll the image and paint nothing', async ({ page }) => {
    await zoomInUntilScrollable();
    await paint.selectTool(DrawingToolType.pencil);
    const before: ScreenPoint = await scrollPosition();
    expect(before.x, 'the magnifier centred the image, so there is room to scroll both ways').toBeGreaterThan(40);
    expect(before.y).toBeGreaterThan(30);

    const from: ScreenPoint = await viewportCentre();
    await touch.pan(from, { x: from.x + 40, y: from.y + 30 });

    await expect.poll(scrollPosition).toEqual({ x: before.x - 40, y: before.y - 30 });
    expect(await imageMask(page, { w: 0, h: 0, width: 300, height: 200 })).toEqual(
      Array(200).fill('.'.repeat(300))
    );
  });

  test('two fingers zoom in and out by 2x steps, keeping the point between them where it is', async ({ page }) => {
    await zoomInUntilScrollable();
    const canvas: Locator = imageCanvas(page);
    const centre: ScreenPoint = await viewportCentre();
    const pinched = await imagePointUnder(centre);

    await touch.pinch(centre, 100, 200);
    await expect(canvas).toHaveCSS('width', '2400px');
    await expect.poll(() => imagePointUnder(centre).then((p) => p.w)).toBeCloseTo(pinched.w, 0);
    expect((await imagePointUnder(centre)).h).toBeCloseTo(pinched.h, 0);

    await touch.pinch(centre, 200, 100);
    await expect(canvas).toHaveCSS('width', '1200px');
    await expect.poll(() => imagePointUnder(centre).then((p) => p.w)).toBeCloseTo(pinched.w, 0);
    expect((await imagePointUnder(centre)).h).toBeCloseTo(pinched.h, 0);

    expect(await page.evaluate(() => window.visualViewport.scale)).toBe(1);
  });
});

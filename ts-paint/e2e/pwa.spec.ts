import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, WHITE } from './helpers/pixels';

test.describe('installable app', () => {
  test.use({ serviceWorkers: 'allow' });

  test('registers the service worker and links a manifest with image file handlers', async ({ page }) => {
    const paint = new PaintPage(page);
    await paint.goto();
    const workerUrl: string = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration.active?.scriptURL ?? registration.installing?.scriptURL ?? '';
    });
    expect(workerUrl).toContain('ngsw-worker.js');
    const manifestHref: string = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifest = await (await page.request.get(manifestHref)).json();
    expect(manifest.file_handlers[0].accept['image/png']).toContain('.png');
    expect(manifest.icons.length).toBeGreaterThan(0);
  });
});

test.describe('high-DPI screens', () => {
  test.use({ deviceScaleFactor: 2 });

  test('keeps a 1:1 pixel mapping at device scale 2', async ({ page }) => {
    const paint = new PaintPage(page);
    await paint.goto();
    expect(await page.evaluate(() => document.body.style.zoom)).toBe('1');
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(10, 10);
    await expectPixel(page, 10, 10, BLACK);
    await expectPixel(page, 11, 10, WHITE);
    await expectPixel(page, 10, 11, WHITE);
  });
});

test.describe('fractional device scale', () => {
  test.use({ deviceScaleFactor: 1.5 });

  test('snaps the page zoom so that image pixels stay whole device pixels', async ({ page }) => {
    const paint = new PaintPage(page);
    await paint.goto();
    const zoom: number = await page.evaluate(() => Number(document.body.style.zoom));
    expect(zoom).toBeCloseTo(2 / 1.5, 4);
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(10, 10);
    await expectPixel(page, 10, 10, BLACK);
    await expectPixel(page, 9, 10, WHITE);
  });
});

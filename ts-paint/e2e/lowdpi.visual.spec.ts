import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';

// The visual project renders at device scale 2; this is the one check of the scale 1 path (no page zoom)
test.describe('low-DPI rendering', () => {
  test.use({ deviceScaleFactor: 1 });

  test('the window at device scale 1 stays crisp', async ({ page }) => {
    const paint = new PaintPage(page);
    await paint.goto();
    await expect(page).toHaveScreenshot('startup-dpr1.png');
  });
});

import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';

test('the window at startup', async ({ page }) => {
  const paint = new PaintPage(page);
  await paint.goto();
  await expect(page).toHaveScreenshot('startup.png');
});

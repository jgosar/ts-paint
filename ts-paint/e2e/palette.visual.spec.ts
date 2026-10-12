import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';

test('palette with red primary and blue secondary', async ({ page }) => {
  const paint = new PaintPage(page);
  await paint.goto();
  await paint.setPrimaryColor(5);
  await paint.setSecondaryColor(13);
  await expect(paint.palette).toHaveScreenshot('palette.png');
});

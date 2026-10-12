import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, imageSize, WHITE } from './helpers/pixels';
import { createSolidPng } from './fixtures/png';
import { pasteFile } from './helpers/files';

test.describe('selection', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
    // A filled black 21x21 square at (10,10)
    await paint.selectTool(DrawingToolType.rectangle);
    await paint.selectPickerOption(2);
    await paint.drag([
      [10, 10],
      [30, 30],
    ]);
    await paint.selectTool(DrawingToolType.rectangleSelect);
  });

  test('selecting shows the frame and Escape removes it', async () => {
    await paint.drag([
      [5, 5],
      [35, 35],
    ]);
    await expect(paint.selectionFrame).toBeVisible();
    await paint.hotkey('Escape');
    await expect(paint.selectionFrame).toBeHidden();
  });

  test('a selection can be dragged and lands where it is dropped', async ({ page }) => {
    await paint.drag([
      [5, 5],
      [35, 35],
    ]);
    await paint.drag([
      [20, 20],
      [120, 120],
    ]);
    // A click outside pastes the selection down (and starts a new one-pixel selection, which Escape removes)
    await paint.clickCanvas(250, 150);
    await paint.hotkey('Escape');
    await expect(paint.selectionFrame).toBeHidden();
    await expectPixel(page, 120, 120, BLACK);
    await expectPixel(page, 110, 110, BLACK);
    await expectPixel(page, 20, 20, WHITE);
  });

  test('moving a selection in several steps is a single undo step', async ({ page }) => {
    await paint.drag([
      [5, 5],
      [35, 35],
    ]);
    await paint.drag([
      [20, 20],
      [60, 20],
    ]);
    await paint.drag([
      [60, 20],
      [60, 60],
    ]);
    await paint.hotkey('Escape');
    await expectPixel(page, 60, 60, BLACK);
    await paint.hotkey('Control+z'); // undo the deselect (paste into image)
    await paint.hotkey('Control+z'); // undo the whole move
    await paint.hotkey('Escape');
    await expectPixel(page, 20, 20, BLACK);
    await expectPixel(page, 60, 60, WHITE);
  });

  test('Delete clears the selected pixels with the secondary color', async ({ page }) => {
    await paint.drag([
      [5, 5],
      [35, 35],
    ]);
    await paint.hotkey('Delete');
    await expect(paint.selectionFrame).toBeHidden();
    await expectPixel(page, 20, 20, WHITE);
  });

  test('Delete with nothing selected does nothing and the app keeps working', async ({ page }) => {
    await paint.hotkey('Delete');
    await expectPixel(page, 20, 20, BLACK);
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(100, 100);
    await expectPixel(page, 100, 100, BLACK);
  });

  test('Cut removes the selection and Paste brings it back as a new selection', async ({ page }) => {
    await paint.drag([
      [5, 5],
      [35, 35],
    ]);
    await paint.hotkey('Control+x');
    await expectPixel(page, 20, 20, WHITE);
    await expect(paint.selectionFrame).toBeHidden();
    // The clipboard is not readable headlessly, so paste the way the OS does: a paste event carrying a file
    await pasteFile(page, 'clip.png', createSolidPng(10, 10, { r: 0, g: 0, b: 0 }));
    await expect(paint.selectionFrame).toBeVisible();
    await expect(paint.toolButton(DrawingToolType.rectangleSelect)).toHaveClass(/--selected/);
    await paint.hotkey('Escape');
    await expectPixel(page, 0, 0, BLACK);
    await expectPixel(page, 9, 9, BLACK);
    await expectPixel(page, 10, 10, WHITE);
  });

  test('Crop shrinks the image to the selection', async ({ page }) => {
    await paint.drag([
      [10, 10],
      [49, 29],
    ]);
    await paint.menu('Image', 'Crop');
    expect(await imageSize(page)).toEqual({ width: 40, height: 20 });
    await expectPixel(page, 0, 0, BLACK);
    await expectPixel(page, 39, 19, WHITE);
  });

  test('Select All selects the whole image', async ({ page }) => {
    await paint.hotkey('Control+a');
    await expect(paint.selectionFrame).toBeVisible();
    const frame = await paint.selectionFrame.boundingBox();
    const tracker = await paint.canvasTracker.boundingBox();
    // The frame draws 2px outside the selection on every side
    expect(frame.width).toBe(tracker.width + 4);
    expect(frame.height).toBe(tracker.height + 4);
    await paint.hotkey('Control+z');
    await expect(paint.selectionFrame).toBeHidden();
    await expectPixel(page, 20, 20, BLACK);
    void page;
  });
});

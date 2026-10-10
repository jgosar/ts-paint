import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { imageCanvas } from './helpers/pixels';

test.describe('drawing', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
  });

  test('a picture drawn with every tool', async ({ page }) => {
    await paint.setPrimaryColor(13); // blue
    await paint.setSecondaryColor(7); // yellow
    for (const [index] of [1, 2, 3, 4, 5].entries()) {
      await paint.selectPickerOption(index);
      await paint.drag([
        [10, 10 + index * 12],
        [90, 10 + index * 12],
      ]);
    }
    await paint.selectTool(DrawingToolType.rectangle);
    for (const fill of [0, 1, 2]) {
      await paint.selectPickerOption(fill);
      await paint.drag([
        [110 + fill * 60, 10],
        [150 + fill * 60, 50],
      ]);
    }
    await paint.selectTool(DrawingToolType.ellipse);
    await paint.drag([
      [10, 80],
      [90, 130],
    ]);
    await paint.setPrimaryColor(5); // red
    await paint.selectTool(DrawingToolType.colorFiller);
    await paint.clickCanvas(50, 105);
    await paint.selectTool(DrawingToolType.pencil);
    await paint.drag([
      [110, 80],
      [150, 120],
      [190, 80],
    ]);
    await paint.selectTool(DrawingToolType.brush);
    for (let shape = 0; shape < 12; shape++) {
      await paint.selectPickerOption(shape);
      await paint.drag([
        [110 + (shape % 6) * 30, 140 + Math.floor(shape / 6) * 25],
        [130 + (shape % 6) * 30, 150 + Math.floor(shape / 6) * 25],
      ]);
    }
    await paint.selectTool(DrawingToolType.eraser);
    for (const size of [0, 1, 2, 3]) {
      await paint.selectPickerOption(size);
      await paint.drag([
        [15 + size * 20, 150],
        [15 + size * 20, 190],
      ]);
    }
    await paint.selectTool(DrawingToolType.rectangleSelect);
    await paint.drag([
      [200, 60],
      [280, 120],
    ]);
    await paint.drag([
      [240, 90],
      [230, 100],
    ]);
    await expect(imageCanvas(page)).toHaveScreenshot('drawing-all-tools.png');
    await expect(paint.canvasTracker.locator('xpath=..')).toHaveScreenshot('drawing-with-selection.png');
  });

  test('the canvas at 2x zoom', async ({ page }) => {
    await paint.drag([
      [10, 10],
      [60, 40],
    ]);
    await paint.selectTool(DrawingToolType.magnifier);
    await paint.clickCanvas(30, 20);
    await expect(paint.canvasTracker.locator('xpath=..')).toHaveScreenshot('drawing-zoomed.png');
    void page;
  });
});

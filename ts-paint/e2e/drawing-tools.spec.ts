import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, BLUE, expectPixel, expectPixels, imageMask, RED, rgb, WHITE } from './helpers/pixels';

// Palette indexes (DEFAULT_AVAILABLE_COLORS): 0 black, 1 white, 5 red, 8 green, 13 blue
const RED_SWATCH: number = 5;
const BLUE_SWATCH: number = 13;

test.describe('drawing tools', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
  });

  test('the line tool is selected at startup and shows the thickness picker', async () => {
    await expect(paint.toolButton(DrawingToolType.line)).toHaveClass(/--selected/);
    await expect(paint.toolOptions.locator('tsp-line-thickness-picker')).toBeVisible();
  });

  test('pencil draws a 1px line along the mouse path', async ({ page }) => {
    await paint.selectTool(DrawingToolType.pencil);
    await paint.drag([
      [10, 10],
      [20, 10],
    ]);
    await expectPixels(page, BLACK, [
      [10, 10],
      [15, 10],
      [20, 10],
    ]);
    await expectPixels(page, WHITE, [
      [9, 10],
      [21, 10],
      [15, 11],
    ]);
  });

  test('line with thickness 5 spills 2px past its ends and is 5 rows tall', async ({ page }) => {
    await paint.selectPickerOption(4);
    await paint.drag([
      [20, 50],
      [40, 50],
    ]);
    await expectPixels(page, BLACK, [
      [30, 48],
      [30, 52],
      [18, 50],
      [42, 50],
    ]);
    await expectPixels(page, WHITE, [
      [30, 47],
      [30, 53],
      [17, 50],
    ]);
  });

  test('shift snaps a nearly horizontal line to the axis', async ({ page }) => {
    await paint.drag(
      [
        [10, 10],
        [30, 13],
      ],
      { shift: true }
    );
    await expectPixel(page, 30, 10, BLACK);
    await expectPixel(page, 30, 13, WHITE);
  });

  test('rectangle fill types: empty, secondary and primary', async ({ page }) => {
    await paint.setSecondaryColor(RED_SWATCH);
    await paint.selectTool(DrawingToolType.rectangle);
    await paint.drag([
      [10, 10],
      [30, 30],
    ]);
    await expectPixel(page, 10, 20, BLACK);
    await expectPixel(page, 20, 20, WHITE);

    await paint.selectPickerOption(1);
    await paint.drag([
      [50, 10],
      [70, 30],
    ]);
    await expectPixel(page, 50, 20, BLACK);
    await expectPixel(page, 60, 20, RED);

    await paint.selectPickerOption(2);
    await paint.drag([
      [90, 10],
      [110, 30],
    ]);
    await expectPixel(page, 100, 20, BLACK);
  });

  test('shift constrains a rectangle to a square', async ({ page }) => {
    await paint.selectTool(DrawingToolType.rectangle);
    await paint.drag(
      [
        [10, 10],
        [40, 20],
      ],
      { shift: true }
    );
    // The shorter side wins: a 31x11 drag becomes an 11x11 square ending at (20,20)
    await expectPixel(page, 20, 15, BLACK);
    await expectPixel(page, 15, 20, BLACK);
    await expectPixel(page, 25, 15, WHITE);
    await expectPixel(page, 15, 25, WHITE);
  });

  test('ellipse draws only the outline', async ({ page }) => {
    await paint.selectTool(DrawingToolType.ellipse);
    await paint.drag([
      [10, 10],
      [50, 40],
    ]);
    await expectPixel(page, 10, 25, BLACK);
    await expectPixel(page, 50, 25, BLACK);
    await expectPixel(page, 30, 25, WHITE);
    await expectPixel(page, 10, 10, WHITE);
  });

  test('color filler fills the enclosed area and is a no-op on its own color', async ({ page }) => {
    await paint.selectTool(DrawingToolType.rectangle);
    await paint.drag([
      [10, 10],
      [30, 30],
    ]);
    await paint.setPrimaryColor(RED_SWATCH);
    await paint.selectTool(DrawingToolType.colorFiller);
    await paint.clickCanvas(20, 20);
    await expectPixel(page, 20, 20, RED);
    await expectPixel(page, 29, 29, RED);
    await expectPixel(page, 40, 40, WHITE);
    await expectPixel(page, 10, 20, BLACK);

    // Filling red with red changes nothing and must not break the app
    await paint.clickCanvas(20, 20);
    await expectPixel(page, 20, 20, RED);
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(60, 60);
    await expectPixel(page, 60, 60, RED);
  });

  test('color picker takes the primary color with the left and the secondary with the right button', async ({
    page,
  }) => {
    await paint.setPrimaryColor(RED_SWATCH);
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(20, 20);
    await paint.setPrimaryColor(0);
    await paint.selectTool(DrawingToolType.colorPicker);
    await paint.clickCanvas(20, 20);
    expect(await paint.sampleColor('primary')).toBe(rgb(RED));
    await paint.clickCanvas(20, 20, 'right');
    expect(await paint.sampleColor('secondary')).toBe(rgb(RED));
    await expectPixel(page, 20, 20, RED);
  });

  test('eraser paints the secondary color in squares and the right button only replaces the primary color', async ({
    page,
  }) => {
    await paint.setSecondaryColor(RED_SWATCH);
    await paint.selectTool(DrawingToolType.eraser);
    await expect(paint.toolOptions.locator('tsp-eraser-size-picker')).toBeVisible();
    await paint.drag([
      [20, 50],
      [30, 50],
    ]);
    // size 8: 3px before and 4px after the mouse pixel
    await expectPixels(page, RED, [
      [17, 47],
      [34, 54],
    ]);
    await expectPixels(page, WHITE, [
      [16, 50],
      [35, 50],
      [25, 46],
      [25, 55],
    ]);

    await paint.setPrimaryColor(RED_SWATCH);
    await paint.setSecondaryColor(BLUE_SWATCH);
    await paint.selectPickerOption(3);
    await paint.drag(
      [
        [20, 45],
        [30, 45],
      ],
      { button: 'right' }
    );
    await expectPixel(page, 25, 50, BLUE);
    await expectPixel(page, 25, 44, WHITE);
    await expectPixel(page, 25, 52, RED);
  });

  test('brush shapes: round, diagonal and square, with the secondary color on the right button', async ({ page }) => {
    await paint.setPrimaryColor(BLUE_SWATCH);
    await paint.setSecondaryColor(RED_SWATCH);
    await paint.selectTool(DrawingToolType.brush);
    await expect(paint.toolOptions.locator('tsp-brush-shape-picker')).toBeVisible();
    await paint.clickCanvas(100, 100);
    expect(await imageMask(page, { w: 98, h: 98, width: 6, height: 6 }, BLUE)).toEqual([
      '......',
      '..##..',
      '.####.',
      '.####.',
      '..##..',
      '......',
    ]);

    await paint.selectPickerOption(9);
    await paint.clickCanvas(150, 100);
    expect(await imageMask(page, { w: 146, h: 96, width: 9, height: 9 }, BLUE)).toEqual([
      '#........',
      '.#.......',
      '..#......',
      '...#.....',
      '....#....',
      '.....#...',
      '......#..',
      '.......#.',
      '........#',
    ]);

    await paint.selectPickerOption(3);
    await paint.drag(
      [
        [200, 100],
        [210, 100],
      ],
      { button: 'right' }
    );
    await expectPixels(page, RED, [
      [197, 97],
      [214, 104],
    ]);
    await expectPixel(page, 196, 100, WHITE);
  });

  test('magnifier zooms in with the left and out with the right button, keeping the pixel mapping', async ({
    page,
  }) => {
    const canvas = page.locator('tsp-zoomable-canvas canvas').first();
    await paint.selectTool(DrawingToolType.magnifier);
    await paint.clickCanvas(100, 100);
    await expect(canvas).toHaveCSS('width', '600px');
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(10, 10);
    await expectPixel(page, 10, 10, BLACK);
    await expectPixel(page, 11, 10, WHITE);
    await paint.selectTool(DrawingToolType.magnifier);
    await paint.clickCanvas(100, 100, 'right');
    await expect(canvas).toHaveCSS('width', '300px');
  });

  test('the footer shows the mouse position and the shape size while dragging', async ({ page }) => {
    const start = page.locator('.tsp-footer-info__coordinates--shape-start');
    const size = page.locator('.tsp-footer-info__coordinates--shape-dimensions');
    const from = await paint.canvasPoint(10, 20);
    await page.mouse.move(from.x, from.y);
    await expect(start).toHaveText('10,20');
    await page.mouse.down();
    const to = await paint.canvasPoint(30, 50);
    await page.mouse.move(to.x, to.y, { steps: 3 });
    await expect(size).toHaveText('21x31');
    await page.mouse.up();
    await expect(size).toHaveText('');
  });
});

import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, WHITE } from './helpers/pixels';

test.describe('undo and redo', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
    await paint.selectTool(DrawingToolType.pencil);
  });

  test('Ctrl+Z undoes and Ctrl+Y repeats, one stroke at a time', async ({ page }) => {
    await paint.clickCanvas(10, 10);
    await paint.drag([
      [20, 20],
      [40, 20],
    ]);
    await paint.hotkey('Control+z');
    await expectPixel(page, 30, 20, WHITE);
    await expectPixel(page, 10, 10, BLACK);
    await paint.hotkey('Control+z');
    await expectPixel(page, 10, 10, WHITE);
    await paint.hotkey('Control+y');
    await expectPixel(page, 10, 10, BLACK);
    await paint.hotkey('Control+y');
    await expectPixel(page, 30, 20, BLACK);
  });

  test('switching tools is part of the history', async ({ page }) => {
    await paint.clickCanvas(10, 10);
    await paint.selectTool(DrawingToolType.line);
    await paint.hotkey('Control+z');
    await expect(paint.toolButton(DrawingToolType.pencil)).toHaveClass(/--selected/);
    await expectPixel(page, 10, 10, BLACK);
    await paint.hotkey('Control+z');
    await expectPixel(page, 10, 10, WHITE);
  });

  test('the Edit menu offers Undo and Repeat', async ({ page }) => {
    await paint.clickCanvas(10, 10);
    await paint.menu('Edit', 'Undo');
    await expectPixel(page, 10, 10, WHITE);
    await paint.menu('Edit', 'Repeat');
    await expectPixel(page, 10, 10, BLACK);
  });

  test('a new action after undo discards the redo history', async ({ page }) => {
    await paint.clickCanvas(10, 10);
    await paint.hotkey('Control+z');
    await paint.clickCanvas(20, 20);
    await paint.hotkey('Control+y');
    await expectPixel(page, 10, 10, WHITE);
    await expectPixel(page, 20, 20, BLACK);
  });

  test('undoing everything and redoing twice is stable', async ({ page }) => {
    await paint.clickCanvas(10, 10);
    await paint.hotkey('Control+z');
    await paint.hotkey('Control+z');
    await paint.hotkey('Control+y');
    await paint.hotkey('Control+y');
    await expectPixel(page, 10, 10, BLACK);
  });

  test('New warns about unsaved changes and then starts over with a blank image', async ({ page }) => {
    await paint.clickCanvas(10, 10);
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.type());
      void dialog.accept();
    });
    // Through the menu: Chromium reserves Ctrl+N for itself, so the shortcut cannot be driven from a test
    await Promise.all([page.waitForNavigation(), paint.menu('File', 'New')]);
    expect(dialogs).toEqual(['beforeunload']);
    await expect(paint.canvasTracker).toBeVisible();
    await expectPixel(page, 10, 10, WHITE);
  });

  test('leaving the page with unsaved changes asks for confirmation', async ({ page }) => {
    await paint.clickCanvas(10, 10);
    const dialog = page.waitForEvent('dialog');
    const closing = page.close({ runBeforeUnload: true });
    const beforeUnload = await dialog;
    expect(beforeUnload.type()).toBe('beforeunload');
    await beforeUnload.dismiss();
    await closing;
  });

  test('the window title marks the file name', async () => {
    await expect(paint.windowTitle).toContainText('untitled - Paint');
  });
});

import { expect, Locator, Page, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, imageCanvas, imageSize, RED, Rgb, WHITE } from './helpers/pixels';

const RED_SWATCH: number = 5;

interface Area {
  w: number;
  h: number;
  width: number;
  height: number;
}

/** Every pixel of a region of the image, in rows */
async function pixelsIn(page: Page, area: Area): Promise<Rgb[]> {
  return imageCanvas(page).evaluate((canvas: HTMLCanvasElement, a: Area) => {
    const data: Uint8ClampedArray = canvas.getContext('2d').getImageData(a.w, a.h, a.width, a.height).data;
    const result: Rgb[] = [];
    for (let i = 0; i < data.length; i += 4) {
      result.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
    return result;
  }, area);
}

function sameColor(a: Rgb, b: Rgb): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

/** Glyphs differ per operating system and are anti-aliased, so tests count the pixels that are not the background */
async function countNot(page: Page, background: Rgb, area?: Area): Promise<number> {
  const { width, height } = await imageSize(page);
  const pixels: Rgb[] = await pixelsIn(page, area ?? { w: 0, h: 0, width, height });
  return pixels.filter((pixel) => !sameColor(pixel, background)).length;
}

async function countColor(page: Page, color: Rgb, area: Area): Promise<number> {
  return (await pixelsIn(page, area)).filter((pixel) => sameColor(pixel, color)).length;
}

/** Presses on an element (its centre, or `at` from its top left), moves by (dx, dy) screen pixels and releases */
async function dragElement(
  page: Page,
  element: Locator,
  dx: number,
  dy: number,
  at?: { x: number; y: number }
): Promise<void> {
  const box = await element.boundingBox();
  const x: number = box.x + (at?.x ?? box.width / 2);
  const y: number = box.y + (at?.y ?? box.height / 2);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 5 });
  await page.mouse.up();
}

test.describe('text tool', () => {
  let paint: PaintPage;

  test.beforeEach(async ({ page }) => {
    paint = new PaintPage(page);
    await paint.goto();
    await paint.selectTool(DrawingToolType.text);
  });

  /** Drags out a text box between two image points; the caret is in it right away */
  async function openBox(from: [number, number], to: [number, number]): Promise<void> {
    await paint.drag([from, to]);
    await expect(paint.textBox).toBeVisible();
    await expect(paint.textArea).toBeFocused();
  }

  /** A click outside the box pastes the text; that click does not open a new box */
  async function commit(): Promise<void> {
    await paint.clickCanvas(290, 190);
    await expect(paint.textBox).toBeHidden();
  }

  test('a dragged box takes the typed text, and a click outside pastes it into the image', async ({ page }) => {
    const area: Area = { w: 20, h: 20, width: 131, height: 41 };
    await openBox([20, 20], [150, 60]);
    const box = await paint.textBox.boundingBox();
    expect([box.width, box.height]).toEqual([131, 41]);

    await page.keyboard.type('Hello');
    await expect(paint.textArea).toHaveValue('Hello');
    expect(await countNot(page, WHITE), 'the text is not in the image while it is being typed').toBe(0);

    await commit();
    await expect(paint.fontsWindow).toBeHidden();
    const inked: number = await countNot(page, WHITE, area);
    expect(inked).toBeGreaterThan(10);
    expect(await countNot(page, WHITE), 'nothing is drawn outside the box').toBe(inked);
  });

  test('a click makes a default-size box that grows downward as the text wraps', async ({ page }) => {
    await paint.clickCanvas(20, 20);
    await expect(paint.textArea).toBeFocused();
    const before = await paint.textBox.boundingBox();
    expect(before.width).toBe(150);

    await page.keyboard.type('The quick brown fox jumps over the lazy dog, twice over');
    const after = await paint.textBox.boundingBox();
    expect(after.width).toBe(150);
    expect(after.y).toBe(before.y);
    expect(after.height).toBeGreaterThan(before.height);
  });

  test('Escape throws the text away', async ({ page }) => {
    await openBox([20, 20], [150, 60]);
    await page.keyboard.type('Gone');
    await page.keyboard.press('Escape');
    await expect(paint.textBox).toBeHidden();
    expect(await countNot(page, WHITE)).toBe(0);
  });

  test('pasting the text is one undo step, and Repeat brings it back', async ({ page }) => {
    await openBox([20, 20], [150, 60]);
    await page.keyboard.type('Undo me');
    await commit();
    const inked: number = await countNot(page, WHITE);
    expect(inked).toBeGreaterThan(10);

    await paint.hotkey('Control+z');
    expect(await countNot(page, WHITE)).toBe(0);
    await paint.hotkey('Control+y');
    expect(await countNot(page, WHITE)).toBe(inked);
  });

  test('opaque text fills its box with the secondary color, transparent text leaves the image visible', async ({
    page,
  }) => {
    await paint.setSecondaryColor(RED_SWATCH);
    await expect(paint.pickerOption(0)).toHaveClass(/--selected/);
    await openBox([20, 20], [150, 60]);
    await page.keyboard.type('Opaque');
    await commit();
    await expectPixel(page, 20, 20, RED);
    await expectPixel(page, 150, 60, RED);
    await expectPixel(page, 151, 61, WHITE);

    await paint.selectPickerOption(1);
    await openBox([20, 100], [150, 140]);
    await page.keyboard.type('Transparent');
    await commit();
    const area: Area = { w: 20, h: 100, width: 131, height: 41 };
    expect(await countColor(page, RED, area)).toBe(0);
    expect(await countNot(page, WHITE, area)).toBeGreaterThan(10);
  });

  test('keys typed into the box do not trigger app shortcuts', async ({ page }) => {
    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(10, 10);
    await paint.selectTool(DrawingToolType.text);
    await openBox([20, 20], [150, 60]);
    await page.keyboard.type('abc');
    // Ctrl+A selects the text, not the image, and Delete deletes it instead of clearing a selection
    await page.keyboard.press('Control+a');
    expect(await paint.textArea.evaluate((area: HTMLTextAreaElement) => area.selectionEnd - area.selectionStart)).toBe(
      3
    );
    await page.keyboard.press('Delete');
    await expect(paint.textArea).toHaveValue('');
    await expect(paint.textBox).toBeVisible();
    await expectPixel(page, 10, 10, BLACK);
  });

  test('the frame moves the box and the handles resize it', async ({ page }) => {
    // Below the Fonts toolbar, which starts out over the top left of the image
    await openBox([20, 100], [120, 140]);
    const start = await paint.textBox.boundingBox();

    // Away from the middle of the edge, where the top resize handle is
    await dragElement(page, page.locator('.tsp-text-box__edge--top'), 30, 40, { x: 20, y: 3 });
    const moved = await paint.textBox.boundingBox();
    expect([moved.x - start.x, moved.y - start.y, moved.width, moved.height]).toEqual([
      30,
      40,
      start.width,
      start.height,
    ]);

    await dragElement(page, page.locator('[data-handle="se"]'), 20, 0);
    const resized = await paint.textBox.boundingBox();
    expect([resized.x, resized.y, resized.width]).toEqual([moved.x, moved.y, moved.width + 20]);

    await paint.textArea.click();
    await page.keyboard.type('Moved');
    await commit();
    const area: Area = { w: 50, h: 140, width: 121, height: resized.height };
    const inked: number = await countNot(page, WHITE, area);
    expect(inked).toBeGreaterThan(10);
    expect(await countNot(page, WHITE)).toBe(inked);
  });

  test('the Fonts toolbar styles the text while the caret stays in the box', async ({ page }) => {
    await openBox([20, 20], [150, 60]);
    await expect(paint.fontsWindow).toBeVisible();
    await page.keyboard.type('a');

    const bold: Locator = paint.fontsWindow.getByRole('button', { name: 'Bold', exact: true });
    await bold.click();
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(paint.textArea).toHaveCSS('font-weight', '700');
    await page.keyboard.type('b');
    await expect(paint.textArea).toHaveValue('ab');

    const heightBefore: number = (await paint.textBox.boundingBox()).height;
    const size: Locator = paint.fontsWindow.locator('.tsp-fonts-window__size input');
    await size.click();
    await size.selectText();
    await size.pressSequentially('36');
    await size.press('Enter');
    await expect(size).toHaveValue('36');
    await expect.poll(async () => (await paint.textBox.boundingBox()).height).toBeGreaterThan(heightBefore);
  });

  test('the Fonts toolbar closes, comes back from the View menu and can be dragged', async ({ page }) => {
    const view: Locator = await paint.openMenu('View');
    await expect(paint.menuItem(view, 'Text Toolbar')).toHaveClass(/--disabled/);
    await page.keyboard.press('Escape');

    await openBox([20, 20], [150, 60]);
    await expect(paint.fontsWindow).toBeVisible();
    await paint.fontsWindow.getByRole('button', { name: 'Close' }).click();
    await expect(paint.fontsWindow).toBeHidden();
    await expect(paint.textBox).toBeVisible();

    await paint.openMenu('View');
    await expect(paint.menuItem(view, 'Text Toolbar')).toHaveAttribute('aria-checked', 'false');
    await paint.menuItem(view, 'Text Toolbar').click();
    await expect(paint.fontsWindow).toBeVisible();
    await expect(paint.textBox, 'the toolbar command keeps the text box open').toBeVisible();

    const before = await paint.fontsWindow.boundingBox();
    await dragElement(page, paint.fontsWindow.locator('.tsp-modal-window__title-bar'), 50, 30);
    const after = await paint.fontsWindow.boundingBox();
    expect([after.x - before.x, after.y - before.y]).toEqual([50, 30]);
  });

  test('text can be edited and pasted at any zoom', async ({ page }) => {
    await paint.selectTool(DrawingToolType.magnifier);
    await paint.clickCanvas(100, 100);
    await expect(imageCanvas(page)).toHaveCSS('width', '600px');
    await paint.selectTool(DrawingToolType.text);

    await openBox([20, 20], [120, 60]);
    const box = await paint.textBox.boundingBox();
    expect([box.width, box.height]).toEqual([202, 82]);
    await page.keyboard.type('Zoom');
    await commit();
    const area: Area = { w: 20, h: 20, width: 101, height: 41 };
    const inked: number = await countNot(page, WHITE, area);
    expect(inked).toBeGreaterThan(5);
    expect(await countNot(page, WHITE)).toBe(inked);
  });
});

test.describe('text tool fonts', () => {
  /** Stands in for the Local Font Access API with one made-up font and a chosen permission state */
  async function fakeLocalFontAccess(page: Page, permission: PermissionState): Promise<void> {
    await page.addInitScript((state: PermissionState) => {
      const w: any = window;
      w.queryLocalFonts = async () => [
        { family: 'Zzz Fake Font', fullName: 'Zzz Fake Font', postscriptName: 'Zzz', style: 'Regular' },
      ];
      const query = navigator.permissions.query.bind(navigator.permissions);
      navigator.permissions.query = (descriptor: PermissionDescriptor) =>
        (descriptor.name as string) === 'local-fonts'
          ? Promise.resolve({ state } as PermissionStatus)
          : query(descriptor);
    }, permission);
  }

  async function openFontList(paint: PaintPage): Promise<Locator> {
    await paint.fontsWindow.locator('.tsp-fonts-window__family [role="combobox"]').click();
    const list: Locator = paint.fontsWindow.getByRole('listbox');
    await expect(list).toBeVisible();
    return list;
  }

  async function openTextBox(paint: PaintPage): Promise<void> {
    await paint.goto();
    await paint.selectTool(DrawingToolType.text);
    await paint.clickCanvas(20, 20);
    await expect(paint.fontsWindow).toBeVisible();
  }

  test('"More fonts..." asks for every installed font and adds them to the list', async ({ page }) => {
    await fakeLocalFontAccess(page, 'prompt');
    const paint: PaintPage = new PaintPage(page);
    await openTextBox(paint);
    let list: Locator = await openFontList(paint);
    await expect(list.getByRole('option', { name: 'Zzz Fake Font' })).toHaveCount(0);
    await list.getByRole('option', { name: 'More fonts...' }).click();

    list = await openFontList(paint);
    await expect(list.getByRole('option', { name: 'Zzz Fake Font' })).toHaveCount(1);
    await expect(list.getByRole('option', { name: 'More fonts...' })).toHaveCount(0);
  });

  test('when the permission is already granted, every installed font is listed right away', async ({ page }) => {
    await fakeLocalFontAccess(page, 'granted');
    const paint: PaintPage = new PaintPage(page);
    await openTextBox(paint);
    const list: Locator = await openFontList(paint);
    await expect(list.getByRole('option', { name: 'Zzz Fake Font' })).toHaveCount(1);
    await expect(list.getByRole('option', { name: 'More fonts...' })).toHaveCount(0);
  });

  test('without Local Font Access, the detected fonts are listed without "More fonts..."', async ({ page }) => {
    await page.addInitScript(() => {
      delete (Window.prototype as any).queryLocalFonts;
      delete (window as any).queryLocalFonts;
    });
    const paint: PaintPage = new PaintPage(page);
    await openTextBox(paint);
    const list: Locator = await openFontList(paint);
    // The app's own pixel font is always there
    await expect(list.getByRole('option', { name: 'Windows95', exact: true })).toHaveCount(1);
    await expect(list.getByRole('option', { name: 'More fonts...' })).toHaveCount(0);
  });
});

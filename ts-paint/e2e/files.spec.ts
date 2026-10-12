import { expect, test } from '@playwright/test';
import { PaintPage } from './pages/paint.page';
import { DrawingToolType } from '../src/app/types/drawing-tools/drawing-tool-type';
import { BLACK, expectPixel, GREEN, imageSize, WHITE } from './helpers/pixels';
import { createPng, createSolidPng, readPngSize } from './fixtures/png';
import {
  dropFile,
  installFileSystemAccessFake,
  installLaunchQueueFake,
  launchFile,
  removeFileSystemAccess,
  savedFiles,
} from './helpers/files';

// 40x30 image, green with a black top-left pixel
const FIXTURE_PNG: Buffer = createPng(40, 30, (w, h) =>
  w === 0 && h === 0 ? { r: 0, g: 0, b: 0 } : { r: 0, g: 128, b: 0 }
);

async function expectFixtureLoaded(paint: PaintPage, name: string): Promise<void> {
  await expect(paint.windowTitle).toContainText(`${name} - Paint`);
  expect(await imageSize(paint.page)).toEqual({ width: 40, height: 30 });
  await expectPixel(paint.page, 0, 0, BLACK);
  await expectPixel(paint.page, 39, 29, GREEN);
}

test.describe('files', () => {
  test('?imageUrl= opens an image from a URL', async ({ page }) => {
    await page.route('**/fixtures/photo.png', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: FIXTURE_PNG })
    );
    const paint = new PaintPage(page);
    await paint.goto('?imageUrl=' + encodeURIComponent('http://localhost:4173/fixtures/photo.png'));
    await expectFixtureLoaded(paint, 'photo');
  });

  test('a dropped file is opened', async ({ page }) => {
    const paint = new PaintPage(page);
    await paint.goto();
    await dropFile(page, 'dropped.png', FIXTURE_PNG);
    await expectFixtureLoaded(paint, 'dropped');
  });

  test('a file launched through the OS file handler is opened and Save writes it back in place', async ({ page }) => {
    await installFileSystemAccessFake(page);
    await installLaunchQueueFake(page);
    const paint = new PaintPage(page);
    await paint.goto();
    await launchFile(page, 'launched.png', FIXTURE_PNG);
    await expectFixtureLoaded(paint, 'launched');

    await paint.selectTool(DrawingToolType.pencil);
    await paint.clickCanvas(5, 5);
    await paint.hotkey('Control+s');
    await expect.poll(async () => (await savedFiles(page)).length).toBe(1);
    const [saved] = await savedFiles(page);
    expect(saved.name).toBe('launched.png');
    expect(readPngSize(saved.bytes)).toEqual({ width: 40, height: 30 });
  });

  test('Open through the file picker and Save As through the save picker', async ({ page }) => {
    await installFileSystemAccessFake(page, { name: 'picked.png', bytes: FIXTURE_PNG });
    const paint = new PaintPage(page);
    await paint.goto();
    await paint.hotkey('Control+o');
    await expectFixtureLoaded(paint, 'picked');

    await paint.menu('File', 'Save As');
    await expect.poll(async () => (await savedFiles(page)).length).toBe(1);
    const [saved] = await savedFiles(page);
    expect(saved.name).toBe('picked.png');
    expect(readPngSize(saved.bytes)).toEqual({ width: 40, height: 30 });
  });

  test('without the File System Access API, Save downloads the image', async ({ page }) => {
    await removeFileSystemAccess(page);
    const paint = new PaintPage(page);
    await paint.goto();
    const download = page.waitForEvent('download');
    await paint.hotkey('Control+s');
    const file = await download;
    expect(file.suggestedFilename()).toBe('untitled.png');
    const bytes: Buffer = await streamToBuffer(await file.createReadStream());
    expect(readPngSize(bytes)).toEqual({ width: 300, height: 200 });
  });

  test('without the File System Access API, Save As opens the Save As window', async ({ page }) => {
    await removeFileSystemAccess(page);
    const paint = new PaintPage(page);
    await paint.goto();
    await paint.menu('File', 'Save As');
    const window = paint.window('tsp-save-as-window');
    await expect(window).toBeVisible();
    const nameInput = window.locator('tsp-text-input input');
    await nameInput.fill('picture');
    await window.locator('tsp-dropdown').click();
    await window.getByRole('option', { name: 'JPEG' }).click();
    const download = page.waitForEvent('download');
    await paint.clickButton(window, 'Save');
    expect((await download).suggestedFilename()).toBe('picture.jpg');
    await expect(window).toBeHidden();
    await expect(paint.windowTitle).toContainText('picture - Paint');
  });

  test('the Save As window keeps the window open when the name is empty', async ({ page }) => {
    await removeFileSystemAccess(page);
    const paint = new PaintPage(page);
    await paint.goto();
    await paint.menu('File', 'Save As');
    const window = paint.window('tsp-save-as-window');
    await window.locator('tsp-text-input input').fill('   ');
    await paint.clickButton(window, 'Save');
    await expect(window).toBeVisible();
    await window.locator('tsp-text-input input').press('Escape');
    await expect(window).toBeHidden();
  });

  test('pasting an image larger than the canvas grows the canvas', async ({ page }) => {
    const paint = new PaintPage(page);
    await paint.goto();
    const { pasteFile } = await import('./helpers/files');
    await pasteFile(page, 'big.png', createSolidPng(400, 100, { r: 0, g: 0, b: 0 }));
    // The file is decoded asynchronously: the pasted image arrives as a floating selection
    await expect(paint.selectionFrame).toBeVisible();
    await paint.hotkey('Escape');
    expect(await imageSize(page)).toEqual({ width: 400, height: 200 });
    await expectPixel(page, 399, 50, BLACK);
    await expectPixel(page, 399, 150, WHITE);
  });
});

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

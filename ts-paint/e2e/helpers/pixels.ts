import { expect, Locator, Page } from '@playwright/test';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const BLACK: Rgb = { r: 0, g: 0, b: 0 };
export const WHITE: Rgb = { r: 255, g: 255, b: 255 };
export const RED: Rgb = { r: 255, g: 0, b: 0 };
export const GREEN: Rgb = { r: 0, g: 128, b: 0 };
export const BLUE: Rgb = { r: 0, g: 0, b: 255 };

export function rgb(color: Rgb): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/** The canvas holding the image itself (the second one is the preview, the third the selection) */
export function imageCanvas(page: Page): Locator {
  return page.locator('tsp-zoomable-canvas canvas').first();
}

export async function imageSize(page: Page): Promise<{ width: number; height: number }> {
  return imageCanvas(page).evaluate((canvas: HTMLCanvasElement) => ({ width: canvas.width, height: canvas.height }));
}

/** Reads one image pixel (image coordinates, independent of zoom) */
export async function imagePixel(page: Page, w: number, h: number): Promise<Rgb> {
  const [r, g, b] = await imageCanvas(page).evaluate(
    (canvas: HTMLCanvasElement, point) => Array.from(canvas.getContext('2d').getImageData(point.w, point.h, 1, 1).data),
    { w, h }
  );
  return { r, g, b };
}

/** Rows of '#' (pixel has `color`) and '.' for a rectangular region of the image, for exact shape assertions */
export async function imageMask(
  page: Page,
  area: { w: number; h: number; width: number; height: number },
  color: Rgb = BLACK
): Promise<string[]> {
  return imageCanvas(page).evaluate(
    (canvas: HTMLCanvasElement, { area: a, color: c }) => {
      const data: Uint8ClampedArray = canvas.getContext('2d').getImageData(a.w, a.h, a.width, a.height).data;
      const rows: string[] = [];
      for (let h = 0; h < a.height; h++) {
        let row: string = '';
        for (let w = 0; w < a.width; w++) {
          const i: number = 4 * (w + a.width * h);
          row += data[i] === c.r && data[i + 1] === c.g && data[i + 2] === c.b ? '#' : '.';
        }
        rows.push(row);
      }
      return rows;
    },
    { area, color }
  );
}

export async function expectPixel(page: Page, w: number, h: number, color: Rgb): Promise<void> {
  expect(await imagePixel(page, w, h), `pixel (${w},${h})`).toEqual(color);
}

export async function expectPixels(page: Page, color: Rgb, points: [number, number][]): Promise<void> {
  for (const [w, h] of points) {
    await expectPixel(page, w, h, color);
  }
}

import { applyBrush, createBrushFromImage, createRoundBrush, createSquareBrush } from './brush.helpers';
import { Brush } from '../types/base/brush';
import { createImage } from './image.helpers';
import { Color } from '../types/base/color';
import { Point } from '../types/base/point';
import { COLOR_WHITE } from '../services/ts-paint/ts-paint.config';
import { getPixel } from './drawing.helpers';

const BLACK: Color = { r: 0, g: 0, b: 0 };
const RED: Color = { r: 255, g: 0, b: 0 };

function isColor(point: Point, image: ImageData, color: Color): boolean {
  const c: Color = getPixel(point, image);
  return c.r === color.r && c.g === color.g && c.b === color.b;
}

function maskOf(brush: Brush): string[] {
  return brush.pixels.map((row) => row.map((p) => (p === null ? '.' : '#')).join(''));
}

describe('createRoundBrush', () => {
  it('is a single pixel for diameter 1', () => {
    const brush: Brush = createRoundBrush(1, BLACK);
    expect(maskOf(brush)).toEqual(['#']);
    expect(brush.origin).toEqual({ w: 0, h: 0 });
  });

  it('is a 2x2 square with the origin in the top left corner for diameter 2', () => {
    const brush: Brush = createRoundBrush(2, BLACK);
    expect(maskOf(brush)).toEqual(['##', '##']);
    expect(brush.origin).toEqual({ w: 0, h: 0 });
  });

  it('is a full 3x3 square for diameter 3', () => {
    const brush: Brush = createRoundBrush(3, BLACK);
    expect(maskOf(brush)).toEqual(['###', '###', '###']);
    expect(brush.origin).toEqual({ w: 1, h: 1 });
  });

  it('is a 4x4 square without corners for diameter 4', () => {
    const brush: Brush = createRoundBrush(4, BLACK);
    expect(maskOf(brush)).toEqual(['.##.', '####', '####', '.##.']);
    expect(brush.origin).toEqual({ w: 1, h: 1 });
  });

  it('is a 5x5 square without corners, in the given color, for diameter 5', () => {
    const brush: Brush = createRoundBrush(5, RED);
    expect(maskOf(brush)).toEqual(['.###.', '#####', '#####', '#####', '.###.']);
    expect(brush.origin).toEqual({ w: 2, h: 2 });
    expect(brush.pixels[2][2]).toEqual(RED);
  });
});

describe('createSquareBrush', () => {
  it('is a filled square centred on the origin', () => {
    const brush: Brush = createSquareBrush(3, BLACK);
    expect(maskOf(brush)).toEqual(['###', '###', '###']);
    expect(brush.origin).toEqual({ w: 1, h: 1 });
  });
});

describe('createBrushFromImage', () => {
  it('copies the pixels of an image, with the origin in the top left corner', () => {
    const image: ImageData = createImage(2, 2, RED);
    const brush: Brush = createBrushFromImage(image);
    expect(brush.pixels).toEqual([
      [RED, RED],
      [RED, RED],
    ]);
    expect(brush.origin).toEqual({ w: 0, h: 0 });
  });

  it('turns pixels of the transparent color into holes', () => {
    const image: ImageData = createImage(2, 1, RED);
    image.data.set([255, 255, 255, 255], 4);
    const brush: Brush = createBrushFromImage(image, COLOR_WHITE);
    expect(brush.pixels).toEqual([[RED, null]]);
  });
});

describe('applyBrush', () => {
  it('paints the brush pixels around the origin', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    applyBrush({ w: 5, h: 5 }, createRoundBrush(3, BLACK), image);
    expect(isColor({ w: 4, h: 4 }, image, BLACK)).toBeTrue();
    expect(isColor({ w: 6, h: 6 }, image, BLACK)).toBeTrue();
    expect(isColor({ w: 3, h: 5 }, image, BLACK)).toBeFalse();
    expect(isColor({ w: 7, h: 5 }, image, BLACK)).toBeFalse();
  });

  it('leaves the image untouched under null brush pixels', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    const brush: Brush = { pixels: [[BLACK, null, RED]], origin: { w: 0, h: 0 } };
    applyBrush({ w: 2, h: 2 }, brush, image);
    expect(isColor({ w: 2, h: 2 }, image, BLACK)).toBeTrue();
    expect(isColor({ w: 3, h: 2 }, image, COLOR_WHITE)).toBeTrue();
    expect(isColor({ w: 4, h: 2 }, image, RED)).toBeTrue();
  });

  it('does not throw when part of the brush falls outside the image', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    expect(() => applyBrush({ w: 0, h: 0 }, createRoundBrush(5, BLACK), image)).not.toThrow();
    expect(isColor({ w: 0, h: 0 }, image, BLACK)).toBeTrue();
    expect(isColor({ w: 2, h: 0 }, image, BLACK)).toBeTrue();
    expect(isColor({ w: 3, h: 0 }, image, BLACK)).toBeFalse();
  });
});

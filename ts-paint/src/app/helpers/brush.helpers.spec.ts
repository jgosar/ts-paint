import {
  applyBrush,
  createBrushForShape,
  createBrushFromImage,
  createDiagonalBrush,
  createRoundBrush,
  createSquareBrush,
  getBrushPadding,
} from './brush.helpers';
import { BrushForm } from '../types/drawing-tools/brush-shape';
import { Brush } from '../types/base/brush';
import { createImage } from './image.helpers';
import { BLACK, RED, WHITE, isColor, setPixel } from '../../testing/image-test.helpers';

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
    setPixel(image, { w: 1, h: 0 }, WHITE);
    const brush: Brush = createBrushFromImage(image, WHITE);
    expect(brush.pixels).toEqual([[RED, null]]);
  });
});

describe('applyBrush', () => {
  it('paints the brush pixels around the origin', () => {
    const image: ImageData = createImage(10, 10, WHITE);
    applyBrush({ w: 5, h: 5 }, createRoundBrush(3, BLACK), image);
    expect(isColor({ w: 4, h: 4 }, image, BLACK)).toBe(true);
    expect(isColor({ w: 6, h: 6 }, image, BLACK)).toBe(true);
    expect(isColor({ w: 3, h: 5 }, image, BLACK)).toBe(false);
    expect(isColor({ w: 7, h: 5 }, image, BLACK)).toBe(false);
  });

  it('leaves the image untouched under null brush pixels', () => {
    const image: ImageData = createImage(10, 10, WHITE);
    const brush: Brush = { pixels: [[BLACK, null, RED]], origin: { w: 0, h: 0 } };
    applyBrush({ w: 2, h: 2 }, brush, image);
    expect(isColor({ w: 2, h: 2 }, image, BLACK)).toBe(true);
    expect(isColor({ w: 3, h: 2 }, image, WHITE)).toBe(true);
    expect(isColor({ w: 4, h: 2 }, image, RED)).toBe(true);
  });

  it('does not throw when part of the brush falls outside the image', () => {
    const image: ImageData = createImage(10, 10, WHITE);
    expect(() => applyBrush({ w: 0, h: 0 }, createRoundBrush(5, BLACK), image)).not.toThrow();
    expect(isColor({ w: 0, h: 0 }, image, BLACK)).toBe(true);
    expect(isColor({ w: 2, h: 0 }, image, BLACK)).toBe(true);
    expect(isColor({ w: 3, h: 0 }, image, BLACK)).toBe(false);
  });
});

describe('createDiagonalBrush', () => {
  it('is a 1px line from bottom left to top right for the forward direction', () => {
    const brush: Brush = createDiagonalBrush(3, 'forward', BLACK);
    expect(maskOf(brush)).toEqual(['..#', '.#.', '#..']);
    expect(brush.origin).toEqual({ w: 1, h: 1 });
  });

  it('is a 1px line from top left to bottom right for the backward direction', () => {
    const brush: Brush = createDiagonalBrush(5, 'backward', BLACK);
    expect(maskOf(brush)).toEqual(['#....', '.#...', '..#..', '...#.', '....#']);
    expect(brush.origin).toEqual({ w: 2, h: 2 });
  });

  it('has its origin 4 pixels in for the 9 pixel brush', () => {
    const brush: Brush = createDiagonalBrush(9, 'forward', BLACK);
    expect(brush.pixels.length).toBe(9);
    expect(brush.origin).toEqual({ w: 4, h: 4 });
  });
});

describe('createBrushForShape', () => {
  it('builds the large round brush with row widths 3,5,7,7,7,5,3', () => {
    const brush: Brush = createBrushForShape({ form: BrushForm.ROUND, size: 7 }, BLACK);
    expect(maskOf(brush)).toEqual(['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..']);
  });

  it('builds the medium round brush with row widths 2,4,4,2', () => {
    const brush: Brush = createBrushForShape({ form: BrushForm.ROUND, size: 4 }, BLACK);
    expect(maskOf(brush)).toEqual(['.##.', '####', '####', '.##.']);
  });

  it('builds a filled square for the square form', () => {
    const brush: Brush = createBrushForShape({ form: BrushForm.SQUARE, size: 2 }, RED);
    expect(maskOf(brush)).toEqual(['##', '##']);
    expect(brush.pixels[0][0]).toEqual(RED);
  });

  it('builds the diagonal brushes', () => {
    expect(maskOf(createBrushForShape({ form: BrushForm.FORWARD_DIAGONAL, size: 3 }, BLACK))).toEqual([
      '..#',
      '.#.',
      '#..',
    ]);
    expect(maskOf(createBrushForShape({ form: BrushForm.BACKWARD_DIAGONAL, size: 3 }, BLACK))).toEqual([
      '#..',
      '.#.',
      '..#',
    ]);
  });
});

describe('getBrushPadding', () => {
  it('is 0 before and after for a single pixel', () => {
    expect(getBrushPadding(createRoundBrush(1, BLACK))).toEqual({ before: 0, after: 0 });
  });

  it('is 3 before and 4 after for the 8 pixel eraser square', () => {
    expect(getBrushPadding(createSquareBrush(8, BLACK))).toEqual({ before: 3, after: 4 });
  });

  it('is 4 on both sides for the 9 pixel diagonal', () => {
    expect(getBrushPadding(createDiagonalBrush(9, 'backward', BLACK))).toEqual({ before: 4, after: 4 });
  });
});

describe('applyBrush with replaceOnly', () => {
  it('only overwrites pixels that have the given color', () => {
    const image: ImageData = createImage(10, 10, WHITE);
    setPixel(image, { w: 5, h: 5 }, RED);
    applyBrush({ w: 5, h: 5 }, createSquareBrush(3, BLACK), image, RED);
    expect(isColor({ w: 5, h: 5 }, image, BLACK)).toBe(true);
    expect(isColor({ w: 4, h: 4 }, image, WHITE)).toBe(true);
    expect(isColor({ w: 6, h: 6 }, image, WHITE)).toBe(true);
  });
});

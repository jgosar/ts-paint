import { drawLine, drawLinesWithBrush, drawThickRectangle, drawEllipse, getPixel } from './drawing.helpers';
import { createSquareBrush } from './brush.helpers';
import { createImage } from './image.helpers';
import { Color } from '../types/base/color';
import { Point } from '../types/base/point';
import { COLOR_WHITE } from '../services/ts-paint/ts-paint.config';

const BLACK: Color = { r: 0, g: 0, b: 0 };

function isPainted(point: Point, image: ImageData): boolean {
  const color: Color = getPixel(point, image);
  return color.r === 0 && color.g === 0 && color.b === 0;
}

function paintedPoints(image: ImageData): Point[] {
  const points: Point[] = [];
  for (let h = 0; h < image.height; h++) {
    for (let w = 0; w < image.width; w++) {
      if (isPainted({ w, h }, image)) {
        points.push({ w, h });
      }
    }
  }
  return points;
}

describe('drawLine', () => {
  it('paints a single pixel for thickness 1', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    drawLine({ w: 5, h: 5 }, { w: 5, h: 5 }, BLACK, image);
    expect(paintedPoints(image)).toEqual([{ w: 5, h: 5 }]);
  });

  it('paints a horizontal line 3 rows tall for thickness 3, with the brush extending 1px past each end', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    drawLine({ w: 2, h: 5 }, { w: 7, h: 5 }, BLACK, image, 3);
    const painted: Point[] = paintedPoints(image);
    expect(painted.length).toBe(8 * 3);
    expect(painted.every((p) => p.h >= 4 && p.h <= 6 && p.w >= 1 && p.w <= 8)).toBeTrue();
  });

  it('paints a 5x5 round brush without corners for a single point at thickness 5', () => {
    const image: ImageData = createImage(11, 11, COLOR_WHITE);
    drawLine({ w: 5, h: 5 }, { w: 5, h: 5 }, BLACK, image, 5);
    const painted: Point[] = paintedPoints(image);
    expect(painted.length).toBe(21);
    expect(isPainted({ w: 3, h: 3 }, image)).toBeFalse();
    expect(isPainted({ w: 7, h: 7 }, image)).toBeFalse();
    expect(isPainted({ w: 3, h: 7 }, image)).toBeFalse();
    expect(isPainted({ w: 7, h: 3 }, image)).toBeFalse();
    expect(isPainted({ w: 3, h: 4 }, image)).toBeTrue();
    expect(isPainted({ w: 5, h: 3 }, image)).toBeTrue();
    expect(isPainted({ w: 7, h: 5 }, image)).toBeTrue();
  });

  it('paints a 2x2 square for thickness 2, extending right and down', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    drawLine({ w: 5, h: 5 }, { w: 5, h: 5 }, BLACK, image, 2);
    expect(paintedPoints(image)).toEqual([
      { w: 5, h: 5 },
      { w: 6, h: 5 },
      { w: 5, h: 6 },
      { w: 6, h: 6 },
    ]);
  });

  it('does not throw when a thick line touches the image edge', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    expect(() => drawLine({ w: 0, h: 0 }, { w: 9, h: 0 }, BLACK, image, 5)).not.toThrow();
    expect(isPainted({ w: 0, h: 0 }, image)).toBeTrue();
    expect(isPainted({ w: 0, h: 2 }, image)).toBeTrue();
    expect(isPainted({ w: 0, h: 3 }, image)).toBeFalse();
  });
});

describe('drawThickRectangle', () => {
  it('paints the same outline as drawRectangle for thickness 1', () => {
    const image: ImageData = createImage(20, 20, COLOR_WHITE);
    drawThickRectangle({ start: { w: 2, h: 2 }, end: { w: 6, h: 6 } }, BLACK, image, 1);
    expect(paintedPoints(image).length).toBe(16);
    expect(isPainted({ w: 3, h: 3 }, image)).toBeFalse();
  });

  it('draws the border inward, staying inside the dragged box', () => {
    const image: ImageData = createImage(60, 60, COLOR_WHITE);
    drawThickRectangle({ start: { w: 10, h: 10 }, end: { w: 50, h: 50 } }, BLACK, image, 5);
    const painted: Point[] = paintedPoints(image);
    const inBox = (p: Point) => p.w >= 10 && p.w <= 50 && p.h >= 10 && p.h <= 50;
    const inHole = (p: Point) => p.w >= 15 && p.w <= 45 && p.h >= 15 && p.h <= 45;
    expect(painted.every((p) => inBox(p) && !inHole(p))).toBeTrue();
    expect(painted.length).toBe(41 * 41 - 31 * 31);
  });

  it('works when the end corner is before the start corner', () => {
    const image: ImageData = createImage(60, 60, COLOR_WHITE);
    drawThickRectangle({ start: { w: 50, h: 50 }, end: { w: 10, h: 10 } }, BLACK, image, 5);
    expect(paintedPoints(image).length).toBe(41 * 41 - 31 * 31);
  });

  it('fills a box that is narrower than twice the thickness', () => {
    const image: ImageData = createImage(60, 60, COLOR_WHITE);
    drawThickRectangle({ start: { w: 10, h: 10 }, end: { w: 13, h: 49 } }, BLACK, image, 5);
    const painted: Point[] = paintedPoints(image);
    expect(painted.length).toBe(4 * 40);
    expect(painted.every((p) => p.w >= 10 && p.w <= 13 && p.h >= 10 && p.h <= 49)).toBeTrue();
  });
});

describe('drawEllipse', () => {
  it('paints a 1 pixel outline for thickness 1', () => {
    const image: ImageData = createImage(30, 30, COLOR_WHITE);
    drawEllipse({ w: 5, h: 5 }, { w: 24, h: 14 }, BLACK, image);
    expect(isPainted({ w: 5, h: 9 }, image)).toBeTrue();
    expect(isPainted({ w: 6, h: 9 }, image)).toBeFalse();
    expect(isPainted({ w: 14, h: 9 }, image)).toBeFalse();
  });

  it('paints a thick ring that stays inside the dragged box', () => {
    const image: ImageData = createImage(60, 60, COLOR_WHITE);
    drawEllipse({ w: 10, h: 10 }, { w: 50, h: 40 }, BLACK, image, 5);
    const painted: Point[] = paintedPoints(image);
    expect(painted.length).toBeGreaterThan(0);
    expect(painted.every((p) => p.w >= 10 && p.w <= 50 && p.h >= 10 && p.h <= 40)).toBeTrue();
    // centre row: exactly 5 pixels painted at each end
    for (let w = 10; w <= 14; w++) {
      expect(isPainted({ w, h: 25 }, image))
        .withContext(`w=${w}`)
        .toBeTrue();
    }
    for (let w = 46; w <= 50; w++) {
      expect(isPainted({ w, h: 25 }, image))
        .withContext(`w=${w}`)
        .toBeTrue();
    }
    expect(isPainted({ w: 15, h: 25 }, image)).toBeFalse();
    expect(isPainted({ w: 45, h: 25 }, image)).toBeFalse();
    expect(isPainted({ w: 30, h: 25 }, image)).toBeFalse();
    // centre column: exactly 5 pixels painted at each end
    for (let h = 10; h <= 14; h++) {
      expect(isPainted({ w: 30, h }, image))
        .withContext(`h=${h}`)
        .toBeTrue();
    }
    expect(isPainted({ w: 30, h: 15 }, image)).toBeFalse();
  });

  it('has no holes in the ring along the diagonal', () => {
    const image: ImageData = createImage(60, 60, COLOR_WHITE);
    drawEllipse({ w: 10, h: 10 }, { w: 50, h: 50 }, BLACK, image, 3);
    // Walk the diagonal from the corner towards the centre: the painted pixels must form one contiguous run.
    // A 3px ring crossed at 45 degrees spans about 3 / sqrt(2) = 2 pixels.
    const paintedIndices: number[] = [];
    for (let i = 0; i <= 20; i++) {
      if (isPainted({ w: 10 + i, h: 10 + i }, image)) {
        paintedIndices.push(i);
      }
    }
    expect(paintedIndices.length).toBeGreaterThanOrEqual(2);
    const first: number = paintedIndices[0];
    expect(paintedIndices).toEqual(paintedIndices.map((_, idx) => first + idx));
  });

  it('fills the whole ellipse when the box is too small for the ring', () => {
    const image: ImageData = createImage(30, 30, COLOR_WHITE);
    drawEllipse({ w: 5, h: 5 }, { w: 12, h: 12 }, BLACK, image, 5);
    expect(isPainted({ w: 8, h: 8 }, image)).toBeTrue();
    expect(isPainted({ w: 9, h: 9 }, image)).toBeTrue();
    expect(paintedPoints(image).every((p) => p.w >= 5 && p.w <= 12 && p.h >= 5 && p.h <= 12)).toBeTrue();
  });
});

describe('drawLinesWithBrush', () => {
  it('stamps the brush once for a single point', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    drawLinesWithBrush([{ w: 5, h: 5 }], createSquareBrush(2, BLACK), image);
    expect(paintedPoints(image)).toEqual([
      { w: 5, h: 5 },
      { w: 6, h: 5 },
      { w: 5, h: 6 },
      { w: 6, h: 6 },
    ]);
  });

  it('stamps the brush along every segment of a polyline', () => {
    const image: ImageData = createImage(20, 20, COLOR_WHITE);
    drawLinesWithBrush(
      [
        { w: 2, h: 2 },
        { w: 10, h: 2 },
        { w: 10, h: 10 },
      ],
      createSquareBrush(3, BLACK),
      image
    );
    const painted: Point[] = paintedPoints(image);
    // horizontal segment: 11 columns (1..11) x 3 rows (1..3); vertical: 3 columns (9..11) x 8 more rows (4..11)
    expect(painted.length).toBe(11 * 3 + 3 * 8);
    expect(isPainted({ w: 1, h: 1 }, image)).toBeTrue();
    expect(isPainted({ w: 11, h: 11 }, image)).toBeTrue();
    expect(isPainted({ w: 8, h: 5 }, image)).toBeFalse();
  });

  it('only replaces pixels of the replaceOnly color', () => {
    const image: ImageData = createImage(10, 10, COLOR_WHITE);
    image.data.set([255, 0, 0, 255], 4 * (3 + 10 * 2)); // (3,2) is red
    const red: Color = { r: 255, g: 0, b: 0 };
    drawLinesWithBrush(
      [
        { w: 1, h: 2 },
        { w: 6, h: 2 },
      ],
      createSquareBrush(3, BLACK),
      image,
      red
    );
    expect(paintedPoints(image)).toEqual([{ w: 3, h: 2 }]);
  });
});

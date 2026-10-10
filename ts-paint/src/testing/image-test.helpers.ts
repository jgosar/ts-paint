import { Color } from '../app/types/base/color';
import { Point } from '../app/types/base/point';
import { createImage, getPixelOffset } from '../app/helpers/image.helpers';
import { getPixel } from '../app/helpers/drawing.helpers';

export const BLACK: Color = { r: 0, g: 0, b: 0 };
export const WHITE: Color = { r: 255, g: 255, b: 255 };
export const RED: Color = { r: 255, g: 0, b: 0 };
export const GREEN: Color = { r: 0, g: 128, b: 0 };
export const BLUE: Color = { r: 0, g: 0, b: 255 };

export function sameColor(a: Color, b: Color): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

/** True when the pixel has exactly the given RGB (alpha is ignored) */
export function isColor(point: Point, image: ImageData, color: Color): boolean {
  return sameColor(getPixel(point, image), color);
}

export function alphaAt(point: Point, image: ImageData): number {
  return image.data[getPixelOffset(point, image) + 3];
}

export function setPixel(image: ImageData, point: Point, color: Color, alpha: number = 255) {
  image.data.set([color.r, color.g, color.b, alpha], getPixelOffset(point, image));
}

/** All points whose pixel has the given color, row by row */
export function pointsOfColor(image: ImageData, color: Color = BLACK): Point[] {
  const points: Point[] = [];
  for (let h = 0; h < image.height; h++) {
    for (let w = 0; w < image.width; w++) {
      if (isColor({ w, h }, image, color)) {
        points.push({ w, h });
      }
    }
  }
  return points;
}

/** Renders the image as rows of '#' (pixel has `color`) and '.' (anything else), handy for exact shape assertions */
export function maskOf(image: ImageData, color: Color = BLACK): string[] {
  const rows: string[] = [];
  for (let h = 0; h < image.height; h++) {
    let row: string = '';
    for (let w = 0; w < image.width; w++) {
      row += isColor({ w, h }, image, color) ? '#' : '.';
    }
    rows.push(row);
  }
  return rows;
}

/** Builds an image from rows of '#' (painted) and '.' (background) */
export function imageFromMask(rows: string[], painted: Color = BLACK, background: Color = WHITE): ImageData {
  const image: ImageData = createImage(rows[0].length, rows.length, background);
  rows.forEach((row, h) => {
    [...row].forEach((cell, w) => {
      if (cell === '#') {
        setPixel(image, { w, h }, painted);
      }
    });
  });
  return image;
}

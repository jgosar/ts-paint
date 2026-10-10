import { Brush } from '../types/base/brush';
import { Color } from '../types/base/color';
import { Point } from '../types/base/point';
import { calculateLocation, getPixelOffset, setPixelInOriginalImage } from './image.helpers';
import { BrushForm, BrushShape } from '../types/drawing-tools/brush-shape';

/** Builds a brush from a boolean mask (indexed mask[h][w]); true cells get the color, false cells stay transparent. */
export function createBrushFromMask(mask: boolean[][], origin: Point, color: Color): Brush {
  const pixels: (Color | null)[][] = mask.map((row) => row.map((isPainted) => (isPainted ? color : null)));
  return { pixels, origin };
}

/** A round brush of the given diameter, the way MS Paint draws thick lines: 1 is a single pixel, 2 and 3 are full
 * squares, 4 and 5 are squares without their corners. For even diameters the origin sits above left of the centre. */
export function createRoundBrush(diameter: number, color: Color): Brush {
  const center: number = (diameter - 1) / 2;
  const radiusSquared: number = (diameter / 2) * (diameter / 2);
  const mask: boolean[][] = [];
  for (let h = 0; h < diameter; h++) {
    mask.push([]);
    for (let w = 0; w < diameter; w++) {
      mask[h].push((w - center) ** 2 + (h - center) ** 2 <= radiusSquared);
    }
  }
  return createBrushFromMask(mask, getCenteredOrigin(diameter), color);
}

export function createSquareBrush(size: number, color: Color): Brush {
  const mask: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => true));
  return createBrushFromMask(mask, getCenteredOrigin(size), color);
}

/** A 1 px wide diagonal line of `length` pixels: 'forward' runs from bottom left to top right (like "/"),
 * 'backward' from top left to bottom right (like "\\"). */
export function createDiagonalBrush(length: number, direction: 'forward' | 'backward', color: Color): Brush {
  const mask: boolean[][] = [];
  for (let h = 0; h < length; h++) {
    const paintedW: number = direction === 'forward' ? length - 1 - h : h;
    mask.push(Array.from({ length }, (_, w) => w === paintedW));
  }
  return createBrushFromMask(mask, getCenteredOrigin(length), color);
}

/** Builds one of the brushes of the brush tool */
export function createBrushForShape(shape: BrushShape, color: Color): Brush {
  switch (shape.form) {
    case BrushForm.ROUND:
      return createRoundBrush(shape.size, color);
    case BrushForm.SQUARE:
      return createSquareBrush(shape.size, color);
    case BrushForm.FORWARD_DIAGONAL:
      return createDiagonalBrush(shape.size, 'forward', color);
    case BrushForm.BACKWARD_DIAGONAL:
      return createDiagonalBrush(shape.size, 'backward', color);
  }
}

/** How far the brush reaches before (up/left of) and after (down/right of) the point it is applied to */
export function getBrushPadding(brush: Brush): { before: number; after: number } {
  const size: number = brush.pixels.length;
  return { before: brush.origin.w, after: size - 1 - brush.origin.w };
}

/** Turns an image (e.g. the current selection) into a brush. Pixels of `transparentColor` become holes, which is
 * what the "Draw Opaque" option in MS Paint does when it is switched off. */
export function createBrushFromImage(image: ImageData, transparentColor?: Color): Brush {
  const pixels: (Color | null)[][] = Array.from({ length: image.height }, () => []);
  for (let i = 0; i < image.data.length; i += 4) {
    const location: Point = calculateLocation(i, image);
    const color: Color = { r: image.data[i], g: image.data[i + 1], b: image.data[i + 2] };
    const isTransparent: boolean =
      transparentColor !== undefined &&
      color.r === transparentColor.r &&
      color.g === transparentColor.g &&
      color.b === transparentColor.b;
    pixels[location.h].push(isTransparent ? null : color);
  }
  return { pixels, origin: { w: 0, h: 0 } };
}

/** Stamps the brush onto the image so that the brush origin lands on the given point. Pixels outside the image are ignored.
 * With `replaceOnly` set, only image pixels of that color are painted over (the "color eraser" of MS Paint). */
export function applyBrush(point: Point, brush: Brush, image: ImageData, replaceOnly?: Color) {
  for (let h = 0; h < brush.pixels.length; h++) {
    for (let w = 0; w < brush.pixels[h].length; w++) {
      const color: Color | null = brush.pixels[h][w];
      const target: Point = { w: point.w + w - brush.origin.w, h: point.h + h - brush.origin.h };
      if (color !== null && (replaceOnly === undefined || hasColor(target, replaceOnly, image))) {
        setPixelInOriginalImage(target, color, image);
      }
    }
  }
}

function hasColor(point: Point, color: Color, image: ImageData): boolean {
  if (point.w < 0 || point.h < 0 || point.w >= image.width || point.h >= image.height) {
    return false;
  }
  const offset: number = getPixelOffset(point, image);
  return image.data[offset] === color.r && image.data[offset + 1] === color.g && image.data[offset + 2] === color.b;
}

/** For odd sizes the origin is the exact centre; for even sizes it is the pixel above left of the centre,
 * so the brush extends floor((size-1)/2) pixels before the point and ceil((size-1)/2) pixels after it. */
function getCenteredOrigin(size: number): Point {
  const offset: number = Math.floor((size - 1) / 2);
  return { w: offset, h: offset };
}

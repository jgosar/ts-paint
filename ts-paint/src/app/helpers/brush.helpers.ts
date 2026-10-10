import { Brush } from '../types/base/brush';
import { Color } from '../types/base/color';
import { Point } from '../types/base/point';
import { calculateLocation, setPixelInOriginalImage } from './image.helpers';

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

/** Stamps the brush onto the image so that the brush origin lands on the given point. Pixels outside the image are ignored. */
export function applyBrush(point: Point, brush: Brush, image: ImageData) {
  for (let h = 0; h < brush.pixels.length; h++) {
    for (let w = 0; w < brush.pixels[h].length; w++) {
      const color: Color | null = brush.pixels[h][w];
      if (color !== null) {
        setPixelInOriginalImage({ w: point.w + w - brush.origin.w, h: point.h + h - brush.origin.h }, color, image);
      }
    }
  }
}

/** For odd sizes the origin is the exact centre; for even sizes it is the pixel above left of the centre,
 * so the brush extends floor((size-1)/2) pixels before the point and ceil((size-1)/2) pixels after it. */
function getCenteredOrigin(size: number): Point {
  const offset: number = Math.floor((size - 1) / 2);
  return { w: offset, h: offset };
}

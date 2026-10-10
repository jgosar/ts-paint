import { Color } from './color';
import { Point } from './point';

/** A stamp of pixels that gets applied repeatedly along a path, e.g. for thick lines, the brush tool
 * or when a selection is dragged with Shift held down (the selection acts as a brush). */
export interface Brush {
  /** Indexed as pixels[h][w]. A null entry is transparent and leaves the image untouched. */
  pixels: (Color | null)[][];
  /** The brush pixel that lands on the point the brush is applied to. */
  origin: Point;
}

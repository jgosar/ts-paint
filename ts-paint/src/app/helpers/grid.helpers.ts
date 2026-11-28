import { Color } from '../types/base/color';
import { setPixelInOriginalImage } from './image.helpers';

/** The grid is offered from 400% up, like in the original Paint */
export const MIN_GRID_ZOOM: number = 4;

/** The two greys of the user interface, checkered along the grid lines */
export const GRID_COLOR_DARK: Color = { r: 134, g: 138, b: 142 };
export const GRID_COLOR_LIGHT: Color = { r: 195, g: 199, b: 203 };

export function isGridAvailable(zoom: number): boolean {
  return zoom >= MIN_GRID_ZOOM;
}

/**
 * One zoomed image pixel of the grid, to be repeated over the image: a line along its top and left edge, see-through
 * elsewhere. The line is one screen pixel thick whatever the zoom, and checkered dark and light grey, starting dark
 * in the corner. The zoom is a power of two, so the checkering carries on seamlessly from one tile to the next.
 */
export function createGridTile(zoom: number): ImageData {
  const tile: ImageData = new ImageData(zoom, zoom);
  for (let i = 0; i < zoom; i++) {
    const color: Color = i % 2 === 0 ? GRID_COLOR_DARK : GRID_COLOR_LIGHT;
    setPixelInOriginalImage({ w: i, h: 0 }, color, tile);
    setPixelInOriginalImage({ w: 0, h: i }, color, tile);
  }
  return tile;
}

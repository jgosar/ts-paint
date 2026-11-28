import { createGridTile, GRID_COLOR_DARK, GRID_COLOR_LIGHT, isGridAvailable } from './grid.helpers';
import { alphaAt, isColor } from '../../testing/image-test.helpers';

/** Rows of 'D' (dark grey), 'L' (light grey) and '.' (see-through) */
function tileRows(tile: ImageData): string[] {
  const rows: string[] = [];
  for (let h = 0; h < tile.height; h++) {
    let row: string = '';
    for (let w = 0; w < tile.width; w++) {
      if (alphaAt({ w, h }, tile) === 0) {
        row += '.';
      } else {
        row += isColor({ w, h }, tile, GRID_COLOR_DARK) ? 'D' : isColor({ w, h }, tile, GRID_COLOR_LIGHT) ? 'L' : '?';
      }
    }
    rows.push(row);
  }
  return rows;
}

describe('isGridAvailable', () => {
  it('is available from 400% up, like in the original Paint', () => {
    expect([0.5, 1, 2, 4, 8, 16, 32].map(isGridAvailable)).toEqual([false, false, false, true, true, true, true]);
  });
});

describe('createGridTile', () => {
  it('draws one image pixel: a checkered line along its top and left edge, see-through inside', () => {
    expect(tileRows(createGridTile(4))).toEqual(['DLDL', 'L...', 'D...', 'L...']);
  });

  it('keeps the lines one pixel thick at any zoom', () => {
    expect(tileRows(createGridTile(8))).toEqual([
      'DLDLDLDL',
      'L.......',
      'D.......',
      'L.......',
      'D.......',
      'L.......',
      'D.......',
      'L.......',
    ]);
    const tile: ImageData = createGridTile(32);
    expect(tile.width).toBe(32);
    expect(tile.height).toBe(32);
    expect(tileRows(tile)[1]).toBe('L' + '.'.repeat(31));
  });

  it('is fully opaque on the lines', () => {
    const tile: ImageData = createGridTile(4);
    expect(alphaAt({ w: 0, h: 0 }, tile)).toBe(255);
    expect(alphaAt({ w: 3, h: 0 }, tile)).toBe(255);
    expect(alphaAt({ w: 0, h: 3 }, tile)).toBe(255);
  });
});

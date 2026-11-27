import {
  ALL_RESIZE_HANDLES,
  areaFromStartAndSize,
  areaSize,
  fitAreaInBounds,
  moveArea,
  normalizeArea,
  resizeArea,
} from './area.helpers';
import { RectangleArea } from '../types/base/rectangle-area';
import { Point } from '../types/base/point';

const BOUNDS: Point = { w: 100, h: 50 };
/** 20x10 at (10,5) */
const AREA: RectangleArea = { start: { w: 10, h: 5 }, end: { w: 29, h: 14 } };
const MIN: Point = { w: 5, h: 4 };

describe('areaSize / areaFromStartAndSize', () => {
  it('counts the end pixel in', () => {
    expect(areaSize(AREA)).toEqual({ w: 20, h: 10 });
    expect(areaFromStartAndSize({ w: 10, h: 5 }, { w: 20, h: 10 })).toEqual(AREA);
  });
});

describe('normalizeArea', () => {
  it('puts the start at the top left corner', () => {
    expect(normalizeArea({ start: { w: 29, h: 5 }, end: { w: 10, h: 14 } })).toEqual(AREA);
    expect(normalizeArea(AREA)).toEqual(AREA);
  });
});

describe('moveArea', () => {
  it('moves by the delta', () => {
    expect(moveArea(AREA, { w: 3, h: -2 }, BOUNDS)).toEqual({ start: { w: 13, h: 3 }, end: { w: 32, h: 12 } });
  });

  it('stops at the edges of the image, keeping the size', () => {
    expect(moveArea(AREA, { w: -50, h: -50 }, BOUNDS)).toEqual(areaFromStartAndSize({ w: 0, h: 0 }, { w: 20, h: 10 }));
    expect(moveArea(AREA, { w: 500, h: 500 }, BOUNDS)).toEqual(
      areaFromStartAndSize({ w: 80, h: 40 }, { w: 20, h: 10 })
    );
  });

  it('pins an area bigger than the image to the top left corner', () => {
    const big: RectangleArea = areaFromStartAndSize({ w: 0, h: 0 }, { w: 200, h: 10 });
    expect(moveArea(big, { w: 5, h: 0 }, BOUNDS).start.w).toBe(0);
  });
});

describe('resizeArea', () => {
  it('moves only the edges the handle stands for', () => {
    const delta: Point = { w: 3, h: 2 };
    const results: Record<string, RectangleArea> = {};
    ALL_RESIZE_HANDLES.forEach((handle) => (results[handle] = resizeArea(AREA, handle, delta, BOUNDS, MIN)));

    expect(results.se).toEqual({ start: { w: 10, h: 5 }, end: { w: 32, h: 16 } });
    expect(results.nw).toEqual({ start: { w: 13, h: 7 }, end: { w: 29, h: 14 } });
    expect(results.n).toEqual({ start: { w: 10, h: 7 }, end: { w: 29, h: 14 } });
    expect(results.e).toEqual({ start: { w: 10, h: 5 }, end: { w: 32, h: 14 } });
    expect(results.s).toEqual({ start: { w: 10, h: 5 }, end: { w: 29, h: 16 } });
    expect(results.w).toEqual({ start: { w: 13, h: 5 }, end: { w: 29, h: 14 } });
    expect(results.ne).toEqual({ start: { w: 10, h: 7 }, end: { w: 32, h: 14 } });
    expect(results.sw).toEqual({ start: { w: 13, h: 5 }, end: { w: 29, h: 16 } });
  });

  it('keeps the minimum size', () => {
    expect(areaSize(resizeArea(AREA, 'se', { w: -100, h: -100 }, BOUNDS, MIN))).toEqual(MIN);
    const shrunkFromTopLeft: RectangleArea = resizeArea(AREA, 'nw', { w: 100, h: 100 }, BOUNDS, MIN);
    expect(shrunkFromTopLeft.end).toEqual(AREA.end);
    expect(areaSize(shrunkFromTopLeft)).toEqual(MIN);
  });

  it('stops at the edges of the image', () => {
    expect(resizeArea(AREA, 'se', { w: 500, h: 500 }, BOUNDS, MIN).end).toEqual({ w: 99, h: 49 });
    expect(resizeArea(AREA, 'nw', { w: -500, h: -500 }, BOUNDS, MIN).start).toEqual({ w: 0, h: 0 });
  });
});

describe('fitAreaInBounds', () => {
  it('leaves an area that fits as it is', () => {
    expect(fitAreaInBounds(AREA, MIN, BOUNDS)).toEqual(AREA);
  });

  it('grows the area to the minimum size', () => {
    expect(fitAreaInBounds(areaFromStartAndSize({ w: 10, h: 5 }, { w: 1, h: 1 }), MIN, BOUNDS)).toEqual(
      areaFromStartAndSize({ w: 10, h: 5 }, MIN)
    );
  });

  it('moves an area that sticks out back into the image before shrinking it', () => {
    const atTheEdge: RectangleArea = areaFromStartAndSize({ w: 90, h: 45 }, { w: 20, h: 10 });
    expect(fitAreaInBounds(atTheEdge, MIN, BOUNDS)).toEqual(areaFromStartAndSize({ w: 80, h: 40 }, { w: 20, h: 10 }));
    const tooBig: RectangleArea = areaFromStartAndSize({ w: 10, h: 5 }, { w: 200, h: 10 });
    expect(fitAreaInBounds(tooBig, MIN, BOUNDS)).toEqual(areaFromStartAndSize({ w: 0, h: 5 }, { w: 100, h: 10 }));
  });

  it('accepts corners in any order', () => {
    expect(fitAreaInBounds({ start: AREA.end, end: AREA.start }, MIN, BOUNDS)).toEqual(AREA);
  });
});

import { Point } from '../types/base/point';
import { RectangleArea } from '../types/base/rectangle-area';

/** The handles on the frame of a text box, named after compass directions */
export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export const ALL_RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Width and height of an area whose start is its top left corner and whose end is inclusive */
export function areaSize(area: RectangleArea): Point {
  return { w: area.end.w - area.start.w + 1, h: area.end.h - area.start.h + 1 };
}

export function areaFromStartAndSize(start: Point, size: Point): RectangleArea {
  return { start, end: { w: start.w + size.w - 1, h: start.h + size.h - 1 } };
}

/** The same area with its start at the top left corner */
export function normalizeArea(area: RectangleArea): RectangleArea {
  return {
    start: { w: Math.min(area.start.w, area.end.w), h: Math.min(area.start.h, area.end.h) },
    end: { w: Math.max(area.start.w, area.end.w), h: Math.max(area.start.h, area.end.h) },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Moves the area by the delta, but no further than the edges of an image of the given size */
export function moveArea(area: RectangleArea, delta: Point, bounds: Point): RectangleArea {
  const size: Point = areaSize(area);
  const start: Point = {
    w: clamp(area.start.w + delta.w, 0, Math.max(0, bounds.w - size.w)),
    h: clamp(area.start.h + delta.h, 0, Math.max(0, bounds.h - size.h)),
  };
  return areaFromStartAndSize(start, size);
}

/**
 * Drags the edges that the handle stands for by the delta. The opposite edges stay where they are; the dragged ones
 * stop at the image edges and where the area would get smaller than the minimum size.
 */
export function resizeArea(
  area: RectangleArea,
  handle: ResizeHandle,
  delta: Point,
  bounds: Point,
  minSize: Point
): RectangleArea {
  let { w: left, h: top } = area.start;
  let { w: right, h: bottom } = area.end;
  if (handle.includes('w')) {
    left = clamp(left + delta.w, 0, right - minSize.w + 1);
  }
  if (handle.includes('e')) {
    right = clamp(right + delta.w, left + minSize.w - 1, bounds.w - 1);
  }
  if (handle.includes('n')) {
    top = clamp(top + delta.h, 0, bottom - minSize.h + 1);
  }
  if (handle.includes('s')) {
    bottom = clamp(bottom + delta.h, top + minSize.h - 1, bounds.h - 1);
  }
  return { start: { w: left, h: top }, end: { w: right, h: bottom } };
}

/**
 * Makes the area at least `minSize` big and keeps it inside an image of the given size, moving it back in rather than
 * shrinking it where possible.
 */
export function fitAreaInBounds(area: RectangleArea, minSize: Point, bounds: Point): RectangleArea {
  const normalized: RectangleArea = normalizeArea(area);
  const size: Point = areaSize(normalized);
  const fittedSize: Point = {
    w: clamp(Math.max(size.w, minSize.w), 1, bounds.w),
    h: clamp(Math.max(size.h, minSize.h), 1, bounds.h),
  };
  const start: Point = {
    w: clamp(normalized.start.w, 0, bounds.w - fittedSize.w),
    h: clamp(normalized.start.h, 0, bounds.h - fittedSize.h),
  };
  return areaFromStartAndSize(start, fittedSize);
}

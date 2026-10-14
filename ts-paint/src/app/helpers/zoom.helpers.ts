import { Point } from '../types/base/point';

/** The scroll position that puts the image pixel `centre` in the middle of the viewport at the given zoom */
export function getScrollPositionCentredOn(viewportSize: Point, zoom: number, centre: Point): Point {
  const zoomedCentre: Point = { w: centre.w * zoom, h: centre.h * zoom };
  const w: number = Math.max(0, Math.floor(zoomedCentre.w - viewportSize.w / 2));
  const h: number = Math.max(0, Math.floor(zoomedCentre.h - viewportSize.h / 2));

  return { w, h };
}

/**
 * The scroll position that, at `newZoom`, puts the image point `anchor` where the image point `centre` is now, at
 * `zoom` and `scrollPosition`. With the same zoom it is a pan from `centre` to `anchor`.
 */
export function getScrollPositionAnchoredOn(
  scrollPosition: Point,
  zoom: number,
  newZoom: number,
  anchor: Point,
  centre: Point
): Point {
  const w: number = Math.max(0, Math.round(scrollPosition.w + anchor.w * newZoom - centre.w * zoom));
  const h: number = Math.max(0, Math.round(scrollPosition.h + anchor.h * newZoom - centre.h * zoom));

  return { w, h };
}

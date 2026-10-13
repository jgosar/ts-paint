import { Point } from '../types/base/point';

/** The scroll position that puts the image pixel `centre` in the middle of the viewport at the given zoom */
export function getScrollPositionCentredOn(viewportSize: Point, zoom: number, centre: Point): Point {
  const zoomedCentre: Point = { w: centre.w * zoom, h: centre.h * zoom };
  const w: number = Math.max(0, Math.floor(zoomedCentre.w - viewportSize.w / 2));
  const h: number = Math.max(0, Math.floor(zoomedCentre.h - viewportSize.h / 2));

  return { w, h };
}

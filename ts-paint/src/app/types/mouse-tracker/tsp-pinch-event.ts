import { Point } from '../base/point';

export interface TspPinchEvent {
  /** The image point (not rounded to a pixel) that was under the middle of the fingers when they landed */
  anchor: Point;
  /** The image point under the middle of the fingers now, at the zoom before this event */
  centre: Point;
  /** Set when the fingers moved apart (true) or together (false) by a zoom step; unset when they only pan */
  zoomIn?: boolean;
}

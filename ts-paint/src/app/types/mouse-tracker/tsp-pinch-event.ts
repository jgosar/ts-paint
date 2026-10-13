import { Point } from '../base/point';

export interface TspPinchEvent {
  /** The image pixel under the middle of the two fingers */
  point: Point;
  zoomIn: boolean;
}

import { Point } from '../base/point';

export interface MouseWheelEvent {
  point: Point;
  wheelDelta: number;
}
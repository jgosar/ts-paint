import { Point } from '../base/point';

export interface MousePoint {
  point: Point;
  outsideCanvas?: boolean;
  shiftKey?: boolean;
}

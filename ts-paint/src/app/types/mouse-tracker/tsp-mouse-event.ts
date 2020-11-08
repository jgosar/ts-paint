import { Point } from '../base/point';
import { MouseButton } from './mouse-button';

export interface TspMouseEvent {
  point: Point;
  outsideCanvas?: boolean;
  shiftKey?: boolean;
  wheelDelta?: number;
  button?: MouseButton;
}

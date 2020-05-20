import { Point } from '../base/point';
import { MouseButton } from './mouse-button';

export interface MouseButtonEvent {
  point: Point;
  button: MouseButton;
}

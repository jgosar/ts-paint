import { Point } from '../../base/point';
import { TsPaintAction } from '../ts-paint-action';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';

export interface DrawingToolAction extends TsPaintAction {
  points: Point[],
  swapColors: boolean,
}

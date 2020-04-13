import { DrawingToolType } from './drawing-tool-type';
import { Point } from '../base/point';

export interface DrawingToolAction {
  tool: DrawingToolType,
  points: Point[],
  preview: boolean,
  swapColors?: boolean,
  extraParams?: { [key: string]: any }
}
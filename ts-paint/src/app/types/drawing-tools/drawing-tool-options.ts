import { DrawingToolType } from './drawing-tool-type';
import { FillType } from './fill-type';

export interface DrawingToolOptions {
  [DrawingToolType.rectangle]: RectangleOptions;
}

export interface RectangleOptions {
  fillType: FillType;
}

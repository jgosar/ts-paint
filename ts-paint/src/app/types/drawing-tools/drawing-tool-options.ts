import { DrawingToolType } from './drawing-tool-type';
import { FillType } from './fill-type';

export interface DrawingToolOptions {
  [DrawingToolType.rectangle]: RectangleOptions;
  [DrawingToolType.line]: LineOptions;
}

export interface RectangleOptions {
  fillType: FillType;
}

/** The line thickness is also used for the borders of the shape tools (rectangle, ellipse) */
export interface LineOptions {
  thickness: number;
}

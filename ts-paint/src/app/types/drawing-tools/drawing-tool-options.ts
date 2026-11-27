import { DrawingToolType } from './drawing-tool-type';
import { FillType } from './fill-type';
import { BrushShape } from './brush-shape';

export interface DrawingToolOptions {
  [DrawingToolType.rectangleSelect]: SelectionOptions;
  [DrawingToolType.rectangle]: RectangleOptions;
  [DrawingToolType.line]: LineOptions;
  [DrawingToolType.eraser]: EraserOptions;
  [DrawingToolType.brush]: BrushOptions;
}

/** Options > Draw Opaque: when it is off, the secondary color of a selection is see-through */
export interface SelectionOptions {
  drawOpaque: boolean;
}

export interface RectangleOptions {
  fillType: FillType;
}

/** The line thickness is also used for the borders of the shape tools (rectangle, ellipse) */
export interface LineOptions {
  thickness: number;
}

/** Side of the square the eraser paints with */
export interface EraserOptions {
  size: number;
}

export interface BrushOptions {
  shape: BrushShape;
}

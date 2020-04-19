import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { Point } from '../../base/point';
import { DrawingToolAction } from './drawing-tool-action';
import { DrawPencilAction } from './draw-pencil-action';
import { DrawLineAction } from './draw-line-action';
import { assertUnreachable } from 'src/app/helpers/typescript.helpers';

export function createDrawingToolAction(toolType: DrawingToolType, points: Point[], swapColors: boolean, renderIn: 'image' | 'preview' | 'nowhere'): DrawingToolAction {
  switch (toolType) {
    case DrawingToolType.pencil:
      return new DrawPencilAction(points, swapColors, renderIn);
    case DrawingToolType.line:
      return new DrawLineAction(points, swapColors, renderIn);
  }

  assertUnreachable(toolType);
}
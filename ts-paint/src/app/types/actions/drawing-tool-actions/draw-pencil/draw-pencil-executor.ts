import { DrawingToolActionExecutor } from '../drawing-tool-action-executor';
import { DrawingToolAction } from '../drawing-tool-action';
import { drawLines } from 'src/app/helpers/drawing.helpers';
import { Point } from '../../../base/point';
import { Color } from '../../../base/color';

export class DrawPencilExecutor extends DrawingToolActionExecutor<DrawingToolAction>{
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    drawLines(points, color1, image);
  }
}
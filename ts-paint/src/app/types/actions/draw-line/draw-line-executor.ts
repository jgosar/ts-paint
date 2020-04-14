import { DrawingToolActionExecutor } from '../drawing-tool-action-executor';
import { DrawingToolAction } from '../drawing-tool-action';
import { drawLine } from 'src/app/helpers/drawing.helpers';
import { Point } from '../../base/point';
import { Color } from '../../base/color';

export class DrawLineExecutor extends DrawingToolActionExecutor<DrawingToolAction>{
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    drawLine(points[0], points[1], color1, image);
  }
}
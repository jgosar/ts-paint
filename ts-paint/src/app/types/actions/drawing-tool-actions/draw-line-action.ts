import { DrawingToolAction } from './drawing-tool-action';
import { drawLine } from 'src/app/helpers/drawing.helpers';
import { Point } from 'src/app/types/base/point';
import { Color } from 'src/app/types/base/color';

export class DrawLineAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    drawLine(points[0], points[1], color1, image);
  }
}
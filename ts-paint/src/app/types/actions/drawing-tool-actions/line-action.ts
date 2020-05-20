import { DrawingToolAction } from './drawing-tool-action';
import { drawLine } from '../../../helpers/drawing.helpers';
import { Point } from '../../../types/base/point';
import { Color } from '../../../types/base/color';

export class LineAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    drawLine(points[0], points[1], color1, image);
  }
}

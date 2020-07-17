import { DrawingToolAction } from './drawing-tool-action';
import { drawRectangle } from '../../../helpers/drawing.helpers';
import { Point } from '../../../types/base/point';
import { Color } from '../../../types/base/color';

export class RectangleAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    drawRectangle({ start: points[0], end: points[1] }, color1, image);
  }
}

import { DrawingToolAction } from './drawing-tool-action';
import { drawLine } from '../../../helpers/drawing.helpers';
import { Point } from '../../../types/base/point';
import { Color } from '../../../types/base/color';

export class RectangleAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    const corner2: Point = { w: points[0].w, h: points[1].h };
    const corner4: Point = { w: points[1].w, h: points[0].h };

    drawLine(points[0], corner2, color1, image);
    drawLine(corner2, points[1], color1, image);
    drawLine(points[1], corner4, color1, image);
    drawLine(corner4, points[0], color1, image);
  }
}

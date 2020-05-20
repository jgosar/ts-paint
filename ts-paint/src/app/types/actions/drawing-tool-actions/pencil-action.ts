import { DrawingToolAction } from './drawing-tool-action';
import { drawLines } from '../../../helpers/drawing.helpers';
import { Point } from '../../../types/base/point';
import { Color } from '../../../types/base/color';

export class PencilAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    drawLines(points, color1, image);
  }
}

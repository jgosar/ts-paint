import { DrawingToolAction } from './drawing-tool-action';
import { drawLines } from 'src/app/helpers/drawing.helpers';
import { Point } from 'src/app/types/base/point';
import { Color } from 'src/app/types/base/color';

export class PencilAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    drawLines(points, color1, image);
  }
}
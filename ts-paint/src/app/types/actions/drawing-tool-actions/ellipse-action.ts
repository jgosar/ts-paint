import { DrawingToolAction } from './drawing-tool-action';
import { drawEllipse } from '../../../helpers/drawing.helpers';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';

export class EllipseAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState) {
    drawEllipse(points[0], points[1], color1, image, state.drawingToolOptions[DrawingToolType.line].thickness);
  }
}

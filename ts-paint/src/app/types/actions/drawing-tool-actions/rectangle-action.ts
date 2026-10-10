import { DrawingToolAction } from './drawing-tool-action';
import { drawThickRectangle, fillRectangle } from '../../../helpers/drawing.helpers';
import { Point } from '../../../types/base/point';
import { Color } from '../../../types/base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleOptions } from '../../drawing-tools/drawing-tool-options';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { FillType } from '../../drawing-tools/fill-type';

export class RectangleAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState) {
    const options: RectangleOptions = state.drawingToolOptions[DrawingToolType.rectangle];
    const thickness: number = state.drawingToolOptions[DrawingToolType.line].thickness;

    if (options.fillType === FillType.EMPTY) {
      drawThickRectangle({ start: points[0], end: points[1] }, color1, image, thickness);
    } else if (options.fillType === FillType.FILL_SECONDARY) {
      fillRectangle({ start: points[0], end: points[1] }, color2, image);
      drawThickRectangle({ start: points[0], end: points[1] }, color1, image, thickness);
    } else {
      fillRectangle({ start: points[0], end: points[1] }, color1, image);
    }
  }
}

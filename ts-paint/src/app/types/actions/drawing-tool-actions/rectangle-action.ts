import { DrawingToolAction } from './drawing-tool-action';
import { drawRectangle } from '../../../helpers/drawing.helpers';
import { Point } from '../../../types/base/point';
import { Color } from '../../../types/base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { RectangleOptions } from '../../drawing-tools/drawing-tool-options';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';

export class RectangleAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState) {
    const options: RectangleOptions = state.drawingToolOptions[DrawingToolType.rectangle];

    if(options.fillType==='empty'){
      drawRectangle({ start: points[0], end: points[1] }, color1, image);
    }
  }
}

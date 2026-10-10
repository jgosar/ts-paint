import { BrushStrokeAction } from './brush-stroke-action';
import { createBrushForShape } from '../../../helpers/brush.helpers';
import { Color } from '../../base/color';
import { Brush } from '../../base/brush';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';

export class BrushAction extends BrushStrokeAction {
  protected getBrush(color1: Color, color2: Color, state: TsPaintStoreState): Brush {
    return createBrushForShape(state.drawingToolOptions[DrawingToolType.brush].shape, color1);
  }
}

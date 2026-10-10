import { BrushStrokeAction } from './brush-stroke-action';
import { createSquareBrush } from '../../../helpers/brush.helpers';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { Brush } from '../../base/brush';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';

/** Paints a square of the secondary color. With the right button it is the "color eraser": only pixels of the
 * primary color are replaced. */
export class EraserAction extends BrushStrokeAction {
  constructor(public points: Point[], public swapColors: boolean, public renderIn: 'image' | 'preview' | 'nowhere') {
    super(points, swapColors, renderIn);
    // The color eraser has to see the existing pixels to decide which ones to replace
    this._needsPreviewPixels = swapColors;
  }

  protected getBrush(color1: Color, color2: Color, state: TsPaintStoreState): Brush {
    return createSquareBrush(state.drawingToolOptions[DrawingToolType.eraser].size, state.secondaryColor);
  }

  protected getReplaceOnly(state: TsPaintStoreState): Color | undefined {
    return this.swapColors ? state.primaryColor : undefined;
  }
}

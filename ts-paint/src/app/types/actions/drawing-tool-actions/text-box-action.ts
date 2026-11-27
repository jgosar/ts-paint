import { DrawingToolAction } from './drawing-tool-action';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from '../partial-action-result';
import { drawDashedRectangle } from '../../../helpers/drawing.helpers';
import { COLOR_WHITE } from '../../../services/ts-paint/ts-paint.config';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { TextOptions } from '../../drawing-tools/drawing-tool-options';
import { fitTextBox, getNewTextBoxArea } from '../../../helpers/text.helpers';

/**
 * Dragging with the text tool: shows the dashed outline while dragging, then opens an empty text box. Opening a box
 * changes nothing in the picture, so it is not an undo step; the text becomes one when it is pasted into the image.
 */
export class TextBoxAction extends DrawingToolAction {
  constructor(public points: Point[], public swapColors: boolean, public renderIn: 'image' | 'preview' | 'nowhere') {
    super(points, swapColors, renderIn);
    this._transient = true;
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (this.renderIn === 'preview') {
      return super.addPatchesAndDraw(state);
    }
    const options: TextOptions = state.drawingToolOptions[DrawingToolType.text];
    const imageSize: Point = { w: state.image.width, h: state.image.height };
    const corners: [Point, Point] = [this.points[0], this.points[this.points.length - 1]];
    const area = getNewTextBoxArea(corners, options, imageSize);
    return {
      patches: {
        textBox: fitTextBox({ area, text: '' }, options, imageSize),
        previewImage: new ImageData(1, 1),
      },
    };
  }

  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState) {
    drawDashedRectangle({ start: points[0], end: points[points.length - 1] }, COLOR_WHITE, image, state.zoom);
  }
}

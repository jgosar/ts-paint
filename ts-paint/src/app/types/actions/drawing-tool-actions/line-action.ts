import { DrawingToolAction } from './drawing-tool-action';
import { drawLine } from '../../../helpers/drawing.helpers';
import { Point } from '../../../types/base/point';
import { Color } from '../../../types/base/color';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { RectangleArea } from '../../base/rectangle-area';
import { expandAreaWithinImage } from '../../../helpers/image.helpers';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';

export class LineAction extends DrawingToolAction {
  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState) {
    drawLine(points[0], points[1], color1, image, this.getThickness(state));
  }

  /** The round brush spills past the end points, so the preview and undo area must cover the spill */
  protected getAffectedArea(state: TsPaintStoreState): RectangleArea {
    const thickness: number = this.getThickness(state);
    const before: number = Math.floor((thickness - 1) / 2);
    const after: number = Math.ceil((thickness - 1) / 2);
    return expandAreaWithinImage(super.getAffectedArea(state), before, after, state.image);
  }

  private getThickness(state: TsPaintStoreState): number {
    return state.drawingToolOptions[DrawingToolType.line].thickness;
  }
}

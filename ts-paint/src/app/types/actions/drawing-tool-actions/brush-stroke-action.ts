import { DrawingToolAction } from './drawing-tool-action';
import { drawLinesWithBrush } from '../../../helpers/drawing.helpers';
import { getBrushPadding } from '../../../helpers/brush.helpers';
import { expandAreaWithinImage } from '../../../helpers/image.helpers';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { Brush } from '../../base/brush';
import { RectangleArea } from '../../base/rectangle-area';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';

/** Free-hand tools that stamp a brush along the mouse path (brush, eraser) */
export abstract class BrushStrokeAction extends DrawingToolAction {
  protected abstract getBrush(color1: Color, color2: Color, state: TsPaintStoreState): Brush;

  /** When defined, only pixels of this color are painted over */
  protected getReplaceOnly(state: TsPaintStoreState): Color | undefined {
    return undefined;
  }

  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData, state: TsPaintStoreState) {
    drawLinesWithBrush(points, this.getBrush(color1, color2, state), image, this.getReplaceOnly(state));
  }

  /** The brush spills past the mouse path, so the preview and undo area must cover the spill */
  protected getAffectedArea(state: TsPaintStoreState): RectangleArea {
    const color1: Color = this.swapColors ? state.secondaryColor : state.primaryColor;
    const color2: Color = this.swapColors ? state.primaryColor : state.secondaryColor;
    const { before, after } = getBrushPadding(this.getBrush(color1, color2, state));
    return expandAreaWithinImage(super.getAffectedArea(state), before, after, state.image);
  }
}

import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { Point } from '../base/point';
import { RectangleArea } from '../base/rectangle-area';
import { blendImagePart, getImagePart } from '../../helpers/image.helpers';
import { PasteImageAction } from './paste-image-action';
import { MoveSelectionAction } from './move-selection-action';
import { DeselectSelectionAction } from './deselect-selection-action';

/**
 * Pastes the text of the text box into the image and closes the box. It carries the rendered text rather than the
 * text and font, so repeating it gives the same pixels even if the fonts change in between.
 */
export class DrawTextAction extends TsPaintAction {
  constructor(public textImage: ImageData, public offset: Point) {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    return {
      image: blendImagePart(this.offset, this.textImage, state.image),
      patches: { textBox: undefined },
    };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    const area: RectangleArea = {
      start: this.offset,
      end: { w: this.offset.w + this.textImage.width - 1, h: this.offset.h + this.textImage.height - 1 },
    };
    return [
      new PasteImageAction(getImagePart(area, state.image)),
      new MoveSelectionAction(this.offset),
      new DeselectSelectionAction(),
    ];
  }
}

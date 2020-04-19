import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { Point } from '../base/point';
import { pasteImagePart, getImagePart } from 'src/app/helpers/image.helpers';
import { RectangleArea } from '../base/rectangle-area';
import { PasteImageAction } from './paste-image-action';
import { MoveSelectionAction } from './move-selection-action';

export class DeselectSelectionAction extends TsPaintAction {
  constructor() {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = {};
    const image: ImageData = this.getWorkingImage(state);

    if (state.selectionImage !== undefined) {
      const selectionOffset: Point = state.selectionOffset;
      pasteImagePart(selectionOffset, state.selectionImage, image);

      patches.selectionImage = undefined;
      patches.selectionOffset = { w: 0, h: 0 };
    }

    return { image, patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    const pasteArea: RectangleArea = { start: state.selectionOffset, end: { w: state.selectionOffset.w + state.selectionImage.width - 1, h: state.selectionOffset.h + state.selectionImage.height - 1 } };
    const oldImagePart: ImageData = getImagePart(pasteArea, state.image);
    return [
      new PasteImageAction(oldImagePart),
      new DeselectSelectionAction(),
      new PasteImageAction(state.selectionImage),
      new MoveSelectionAction(state.selectionOffset)
    ];
  }
}
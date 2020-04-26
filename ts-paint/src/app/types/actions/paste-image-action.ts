import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { MoveSelectionAction } from './move-selection-action';
import { resizeImage } from 'src/app/helpers/image.helpers';
import { DeselectSelectionAction } from './deselect-selection-action';

export class PasteImageAction extends TsPaintAction {
  constructor(private imagePart: ImageData) {
    super('image');
    this._deselectsSelection = true;
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = {};
    patches.selectionOffset = { w: 0, h: 0 };
    patches.selectionImage = this.imagePart;
    patches.moveSelectionTool = undefined; // It will get initialized if needed

    if (this.imagePart.width > state.image.width || this.imagePart.height > state.image.height) {
      const image: ImageData = resizeImage(state.image, Math.max(this.imagePart.width, state.image.width), Math.max(this.imagePart.height, state.image.height), state.secondaryColor);
      return { image, patches };
    } else {
      return { patches };
    }
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      //TODO: This is wrong?
      new PasteImageAction(state.selectionImage),
      new MoveSelectionAction(state.selectionOffset),
      new DeselectSelectionAction()
    ];
  }
}

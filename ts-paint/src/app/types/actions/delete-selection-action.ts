import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { MoveSelectionAction } from './move-selection-action';
import { PasteImageUndoAction } from './paste-image-undo-action';

export class DeleteSelectionAction extends TsPaintAction {
  constructor() {
    super('nowhere');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (state.selectionImage !== undefined) {
      const patches: Partial<TsPaintStoreState> = {};

      patches.selectionImage = undefined;
      patches.selectionOffset = { w: 0, h: 0 };
      patches.moveSelectionTool = undefined;

      return { patches };
    }
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new PasteImageUndoAction(state.selectionImage), new MoveSelectionAction(state.selectionOffset)];
  }
}

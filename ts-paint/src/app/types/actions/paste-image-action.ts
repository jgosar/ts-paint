import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { ResizeImageAction } from './resize-image-action';
import { DeleteSelectionAction } from './delete-selection-action';
import { PasteImageUndoAction } from './paste-image-undo-action';

export class PasteImageAction extends PasteImageUndoAction {
  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      new DeleteSelectionAction(),
      new ResizeImageAction(state.image.width, state.image.height)
    ];
  }
}

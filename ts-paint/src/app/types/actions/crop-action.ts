import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { PasteImageAction } from './paste-image-action';
import { DeselectSelectionAction } from './deselect-selection-action';
import { MoveSelectionAction } from './move-selection-action';
import { isDefined } from 'src/app/helpers/typescript.helpers';

export class CropAction extends TsPaintAction {
  constructor() {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    if (isDefined(state.selectionImage)) {
      const patches: Partial<TsPaintStoreState> = DeselectSelectionAction.getDeselectPatches();

      return { image: state.selectionImage, patches };
    } else {
      return {};
    }
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      new PasteImageAction(state.image),
      new DeselectSelectionAction(),
      new PasteImageAction(state.selectionImage),
      new MoveSelectionAction(state.selectionOffset),
    ];
  }
}

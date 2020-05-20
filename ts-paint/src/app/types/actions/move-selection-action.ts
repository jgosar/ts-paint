import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { Point } from '../base/point';

export class MoveSelectionAction extends TsPaintAction {
  constructor(private _newLocation: Point) {
    super('nowhere');
    this._overridesPreviousActionOfSameType = true;
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = { selectionOffset: this._newLocation };
    return { patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new MoveSelectionAction(state.selectionOffset)];
  }
}

import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { Point } from '../base/point';

export class MoveSelectionAction extends TsPaintAction {
  constructor(private newLocation: Point) {
    super('nowhere');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = { selectionOffset: this.newLocation };
    return { patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new MoveSelectionAction(state.selectionOffset)];
  }
}

import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { DrawingToolOptions } from '../drawing-tools/drawing-tool-options';

export class SetDrawingToolOptionsAction extends TsPaintAction {
  constructor(public changedOptions: Partial<DrawingToolOptions>) {
    super('nowhere');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = { drawingToolOptions: {...state.drawingToolOptions, ...this.changedOptions} };

    return { patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new SetDrawingToolOptionsAction(state.drawingToolOptions)];
  }
}

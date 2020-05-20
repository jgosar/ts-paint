import { TsPaintAction } from './ts-paint-action';
import { DrawingToolType } from '../drawing-tools/drawing-tool-type';
import { DrawingTool } from '../drawing-tools/drawing-tool';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';

export class SetDrawingToolAction extends TsPaintAction {
  constructor(public toolType: DrawingToolType, private _getDrawingTool: (toolType: DrawingToolType) => DrawingTool) {
    super('nowhere');
    this._deselectsSelection = true;
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = { selectedDrawingTool: this._getDrawingTool(this.toolType) };

    return { patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      new SetDrawingToolAction(state.selectedDrawingTool?.type, this._getDrawingTool)
    ];
  }
}

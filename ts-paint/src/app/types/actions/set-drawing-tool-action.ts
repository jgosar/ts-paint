import { TsPaintAction } from './ts-paint-action';
import { DrawingToolType } from '../drawing-tools/drawing-tool-type';
import { DrawingTool } from '../drawing-tools/drawing-tool';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';

export class SetDrawingToolAction extends TsPaintAction {
  constructor(public toolType: DrawingToolType, private getDrawingTool: (toolType: DrawingToolType) => DrawingTool) {
    super('nowhere');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = { selectedDrawingTool: this.getDrawingTool(this.toolType) };

    return { patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      new SetDrawingToolAction(state.selectedDrawingTool?.type, this.getDrawingTool)
    ];
  }
}
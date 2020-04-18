import { TsPaintAction } from '../ts-paint-action';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { DrawingTool } from '../../drawing-tools/drawing-tool';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';

export class SetDrawingToolAction extends TsPaintAction {
  constructor(public toolType: DrawingToolType, private getDrawingTool: (toolType: DrawingToolType) => DrawingTool) {
    super('nowhere');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): ImageData | undefined {
    this.addPatch(this.getDrawingTool(this.toolType), 'selectedDrawingTool');

    return undefined;
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      new SetDrawingToolAction(state.selectedDrawingTool?.type, this.getDrawingTool)
    ];
  }
}

import { SetDrawingToolAction, createSetDrawingToolAction } from './set-drawing-tool-action';
import { ActionExecutor } from '../action-executor';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { DrawingTool } from '../../drawing-tools/drawing-tool';

export class SetDrawingToolExecutor extends ActionExecutor<SetDrawingToolAction>{
  constructor(protected getState: () => TsPaintStoreState, private getDrawingTool: (toolType: DrawingToolType) => DrawingTool) {
    super(getState);
  }

  protected executeInternal(action: SetDrawingToolAction, image: ImageData): ImageData {
    this.addPatch(this.getDrawingTool(action.toolType), 'selectedDrawingTool');

    return image;
  }

  protected getUndoActions(action: SetDrawingToolAction): import("../ts-paint-action").TsPaintAction[] {
    return [createSetDrawingToolAction(this.getState().selectedDrawingTool.type)];
  }
}
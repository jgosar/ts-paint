import { ActionExecutor } from '../action-executor';
import { OpenFileAction, createOpenFileAction } from './open-file-action';
import { TsPaintAction } from '../ts-paint-action';

export class OpenFileExecutor extends ActionExecutor<OpenFileAction>{
  protected executeInternal(action: OpenFileAction, image: ImageData): ImageData {
    this.addPatch(action.fileName, 'fileName');
    return action.image;
  }

  protected getUndoActions(action: OpenFileAction): TsPaintAction[] {
    return [createOpenFileAction({ imageData: this.getState().image, fileName: this.getState().fileName })];
  }
}
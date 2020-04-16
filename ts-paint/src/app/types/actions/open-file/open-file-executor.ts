import { ActionExecutor } from '../action-executor';
import { OpenFileAction } from './open-file-action';

export class OpenFileExecutor extends ActionExecutor<OpenFileAction>{
  protected executeInternal(action: OpenFileAction, image: ImageData): ImageData {
    this.addPatch(action.fileName, 'fileName');
    return action.image;
  }
}
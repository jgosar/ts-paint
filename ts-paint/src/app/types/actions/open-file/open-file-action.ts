import { TsPaintAction } from '../ts-paint-action';
import { ImageFileData } from '../../base/image-file-data';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';

export class OpenFileAction extends TsPaintAction {
  constructor(public fileData: ImageFileData) {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): ImageData {
    this.addPatch(this.fileData.fileName, 'fileName');
    return this.fileData.imageData;
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new OpenFileAction({ imageData: state.image, fileName: state.fileName })];
  }
}
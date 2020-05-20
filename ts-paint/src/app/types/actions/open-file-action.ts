import { TsPaintAction } from './ts-paint-action';
import { ImageFileData } from '../base/image-file-data';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';

export class OpenFileAction extends TsPaintAction {
  constructor(public fileData: ImageFileData) {
    super('image');
    this._deselectsSelection = true;
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const patches: Partial<TsPaintStoreState> = { fileName: this.fileData.fileName };
    const image: ImageData = this.fileData.imageData;

    return { image, patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [new OpenFileAction({ imageData: state.image, fileName: state.fileName })];
  }
}

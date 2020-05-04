import { TsPaintAction } from './ts-paint-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { PartialActionResult } from './partial-action-result';
import { resizeImage } from '../../helpers/image.helpers';

export class ResizeImageAction extends TsPaintAction {
  constructor(private width: number, private height: number) {
    super('image');
    this._deselectsSelection = true;
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const image: ImageData = resizeImage(state.image, this.width, this.height, state.secondaryColor);
    return { image };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      new ResizeImageAction(state.image.width, state.image.height)
    ];
  }
}

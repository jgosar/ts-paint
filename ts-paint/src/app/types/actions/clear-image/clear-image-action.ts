import { TsPaintAction } from '../ts-paint-action';
import { Color } from '../../base/color';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { fillImage } from 'src/app/helpers/image.helpers';

export class ClearImageAction extends TsPaintAction {
  constructor() {
    super('image');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): ImageData {
    const backgroundColor: Color = state.secondaryColor;

    return fillImage(new ImageData(state.image.width, state.image.height), backgroundColor);
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return [
      //new PasteImageAction({image: state.image})
    ];
  }
}
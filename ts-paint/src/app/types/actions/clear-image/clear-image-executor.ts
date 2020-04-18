import { ActionExecutor } from '../action-executor';
import { ClearImageAction } from './clear-image-action';
import { Color } from '../../base/color';
import { fillImage } from 'src/app/helpers/image.helpers';
import { TsPaintAction } from '../ts-paint-action';

export class ClearImageExecutor extends ActionExecutor<ClearImageAction>{
  protected executeInternal(action: ClearImageAction, image: ImageData): ImageData {
    const backgroundColor: Color = this.getState().secondaryColor;

    return fillImage(image, backgroundColor);
  }

  protected getUndoActions(action: ClearImageAction): TsPaintAction[] {
    return [
      //createPasteImageAction({image: this.getState().image})
    ];
  }
}

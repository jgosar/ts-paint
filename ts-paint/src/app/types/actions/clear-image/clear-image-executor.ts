import { ActionExecutor } from '../action-executor';
import { ClearImageAction } from './clear-image-action';
import { Color } from '../../base/color';
import { fillArea, fillImage } from 'src/app/helpers/image.helpers';

export class ClearImageExecutor extends ActionExecutor<ClearImageAction>{
  protected executeInternal(action: ClearImageAction, image: ImageData): ImageData {
    const backgroundColor: Color = this.getState().secondaryColor;

    return fillImage(image, backgroundColor);
  }
}

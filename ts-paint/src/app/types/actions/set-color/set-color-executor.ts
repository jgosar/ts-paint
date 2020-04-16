
import { SetColorAction } from './set-color-action';
import { ActionExecutor } from '../action-executor';
import { TsPaintStatePatch } from 'src/app/services/ts-paint/ts-paint-state-patch';
import { ColorSelection } from '../../base/color-selection';

export class SetColorExecutor extends ActionExecutor<SetColorAction>{
  protected executeInternal(action: SetColorAction, image: ImageData): ImageData {
    const selection: ColorSelection = action.selection;

    if (selection.primary) {
      this.addPatch(selection.color, 'primaryColor');
    } else {
      this.addPatch(selection.color, 'secondaryColor');
    }

    return image;
  }
}
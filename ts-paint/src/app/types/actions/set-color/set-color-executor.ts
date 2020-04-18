
import { SetColorAction, createSetColorAction } from './set-color-action';
import { ActionExecutor } from '../action-executor';
import { ColorSelection } from '../../base/color-selection';
import { TsPaintAction } from '../ts-paint-action';
import { Color } from '../../base/color';

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

  protected getUndoActions(action: SetColorAction): TsPaintAction[] {
    var previousColor: Color;
    if (action.selection.primary) {
      previousColor = this.getState().primaryColor;
    } else {
      previousColor = this.getState().secondaryColor;
    }
    return [createSetColorAction({ color: previousColor, primary: action.selection.primary })];
  }
}
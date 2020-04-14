
import { SetColorAction } from './set-color-action';
import { ActionExecutor } from '../action-executor';
import { TsPaintStatePatch } from 'src/app/services/ts-paint/ts-paint-state-patch';
import { ColorSelection } from '../../base/color-selection';

export class SetColorExecutor extends ActionExecutor<SetColorAction>{
  protected executeInternal(action: SetColorAction, image: ImageData): TsPaintStatePatch<any>[] {
    const patches: TsPaintStatePatch<any>[] = [];
    const selection: ColorSelection = action.selection;

    if (selection.primary) {
      patches.push({ value: selection.color, property: 'primaryColor' });
    } else {
      patches.push({ value: selection.color, property: 'secondaryColor' });
    }

    return patches;
  }
}
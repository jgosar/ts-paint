import { TsPaintAction } from '../ts-paint-action';
import { ColorSelection } from '../../base/color-selection';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { Color } from '../../base/color';

export class SetColorAction extends TsPaintAction {
  constructor(public selection: ColorSelection) {
    super('nowhere');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): ImageData | undefined {
    const selection: ColorSelection = this.selection;

    if (selection.primary) {
      this.addPatch(selection.color, 'primaryColor');
    } else {
      this.addPatch(selection.color, 'secondaryColor');
    }

    return undefined;
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    var previousColor: Color;
    if (this.selection.primary) {
      previousColor = state.primaryColor;
    } else {
      previousColor = state.secondaryColor;
    }
    return [new SetColorAction({ color: previousColor, primary: this.selection.primary })];
  }
}
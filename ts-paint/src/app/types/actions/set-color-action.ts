import { TsPaintAction } from './ts-paint-action';
import { ColorSelection } from '../base/color-selection';
import { TsPaintStoreState } from 'src/app/services/ts-paint/ts-paint.store.state';
import { Color } from '../base/color';
import { PartialActionResult } from './partial-action-result';

export class SetColorAction extends TsPaintAction {
  constructor(public selection: ColorSelection) {
    super('nowhere');
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const selection: ColorSelection = this.selection;
    const patches: Partial<TsPaintStoreState> = {};

    if (selection.primary) {
      patches.primaryColor = selection.color;
    } else {
      patches.secondaryColor = selection.color;
    }

    return { patches };
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
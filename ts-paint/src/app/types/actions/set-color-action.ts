import { TsPaintAction } from './ts-paint-action';
import { ColorSelection } from '../base/color-selection';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { Color } from '../base/color';
import { PartialActionResult } from './partial-action-result';

export class SetColorAction extends TsPaintAction {
  constructor(public selection: ColorSelection) {
    super('nowhere');
  }

  public static getSetColorPatches(primary: boolean, color: Color, state: TsPaintStoreState): Partial<TsPaintStoreState> {
    const patches: Partial<TsPaintStoreState> = {};

    if (primary) {
      patches.primaryColor = color;
    } else {
      patches.secondaryColor = color;
    }

    return patches;
  }

  public static getSetColorUndoActions(primary: boolean, state: TsPaintStoreState): TsPaintAction[] {
    let previousColor: Color;
    if (primary) {
      previousColor = state.primaryColor;
    } else {
      previousColor = state.secondaryColor;
    }
    return [new SetColorAction({ color: previousColor, primary })];
  }

  protected addPatchesAndDraw(state: TsPaintStoreState): PartialActionResult {
    const selection: ColorSelection = this.selection;
    const patches: Partial<TsPaintStoreState> = SetColorAction.getSetColorPatches(selection.primary, selection.color, state);

    return { patches };
  }

  protected getUndoActions(state: TsPaintStoreState): TsPaintAction[] {
    return SetColorAction.getSetColorUndoActions(this.selection.primary, state);
  }
}

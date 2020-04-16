import { TsPaintAction } from '../ts-paint-action';
import { ColorSelection } from '../../base/color-selection';
import { TsPaintActionType } from '../ts-paint-action-type';

export interface SetColorAction extends TsPaintAction {
  selection: ColorSelection
}

export function createSetColorAction(selection: ColorSelection): SetColorAction {
  return { type: TsPaintActionType.SET_COLOR, renderIn: 'nowhere', selection: selection };
}
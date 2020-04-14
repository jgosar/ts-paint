import { TsPaintAction } from '../ts-paint-action';
import { ColorSelection } from '../../base/color-selection';

export interface SetColorAction extends TsPaintAction {
  selection: ColorSelection
}
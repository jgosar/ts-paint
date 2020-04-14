import { TsPaintAction } from './ts-paint-action';
import { ColorSelection } from '../base/color-selection';

export interface ChangeColorAction extends TsPaintAction {
  selection: ColorSelection
}
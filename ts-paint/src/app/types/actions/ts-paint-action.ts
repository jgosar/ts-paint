import { RectangleArea } from '../base/rectangle-area';
import { TsPaintActionType } from './ts-paint-action-type';

export interface TsPaintAction {
  type: TsPaintActionType,
  renderIn: 'image' | 'preview' | 'nowhere',
  undoActions?: TsPaintAction[]
}
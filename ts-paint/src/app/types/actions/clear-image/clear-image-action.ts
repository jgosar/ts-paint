import { TsPaintAction } from '../ts-paint-action';
import { TsPaintActionType } from '../ts-paint-action-type';

export interface ClearImageAction extends TsPaintAction {
}

export function createClearImageAction(): ClearImageAction {
  return { type: TsPaintActionType.CLEAR_IMAGE, renderIn: 'image' };
}
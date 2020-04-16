import { TsPaintAction } from '../ts-paint-action';
import { TsPaintActionType } from '../ts-paint-action-type';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';

export interface SetDrawingToolAction extends TsPaintAction {
  toolType: DrawingToolType
}

export function createSetDrawingToolAction(toolType: DrawingToolType): SetDrawingToolAction {
  return { type: TsPaintActionType.SET_DRAWING_TOOL, renderIn: 'nowhere', toolType };
}
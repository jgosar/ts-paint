import { DrawingTool } from './drawing-tool';
import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { DrawingToolAction } from './drawing-tool-action';
import { DrawingToolType } from './drawing-tool-type';

export class LineTool extends DrawingTool {
  constructor(addAction: (action: DrawingToolAction) => void) {
    super(addAction, DrawingToolType.line, DrawingToolBehaviour.CLICK_AND_DRAG, 2);
  }
}
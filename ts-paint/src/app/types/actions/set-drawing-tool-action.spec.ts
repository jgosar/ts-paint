import { vi } from 'vitest';
import { SetDrawingToolAction } from './set-drawing-tool-action';
import { DrawingTool } from '../drawing-tools/drawing-tool';
import { DrawingToolType } from '../drawing-tools/drawing-tool-type';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { classesOf, executeAndUndo } from '../../../testing/action-test.helpers';

function createDrawingTool(toolType: DrawingToolType): DrawingTool {
  return new DrawingTool(
    toolType,
    () => {},
    () => {}
  );
}

describe('SetDrawingToolAction', () => {
  it('selects the tool built by the factory for the given type', () => {
    const state: TsPaintStoreState = createTestState();
    const factory = vi.fn(createDrawingTool);

    const patches: Partial<TsPaintStoreState> = new SetDrawingToolAction(DrawingToolType.line, factory).getStatePatches(
      state
    );

    expect(factory).toHaveBeenCalledWith(DrawingToolType.line);
    expect(patches.selectedDrawingTool).toBeInstanceOf(DrawingTool);
    expect(patches.selectedDrawingTool.type).toBe(DrawingToolType.line);
    expect(patches.image).toBeUndefined();
  });

  it('deselects the selection before running', () => {
    expect(new SetDrawingToolAction(DrawingToolType.line, createDrawingTool).deselectsSelection).toBe(true);
  });

  it('undoes by selecting the previous tool type again', () => {
    const state: TsPaintStoreState = createTestState({
      selectedDrawingTool: createDrawingTool(DrawingToolType.pencil),
    });
    const action: SetDrawingToolAction = new SetDrawingToolAction(DrawingToolType.line, createDrawingTool);

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([SetDrawingToolAction]);
    expect((<SetDrawingToolAction>action.undoActions[0]).toolType).toBe(DrawingToolType.pencil);
    expect(restored.selectedDrawingTool.type).toBe(DrawingToolType.pencil);
  });
});

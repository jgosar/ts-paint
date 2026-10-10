import { MoveSelectionTool } from './move-selection-tool';
import { MoveSelectionAction } from '../actions/move-selection-action';
import { Point } from '../base/point';
import { TspMouseEvent } from '../mouse-tracker/tsp-mouse-event';
import { createTestState } from 'src/testing/state.factory';

function at(w: number, h: number): TspMouseEvent {
  return { point: { w, h } };
}

/** The selection offset the action would apply; the position itself is private to the action */
function positionOf(action: MoveSelectionAction): Point {
  return action.getStatePatches(createTestState(), false).selectionOffset;
}

interface ToolHarness {
  tool: MoveSelectionTool;
  actions: MoveSelectionAction[];
}

function createTool(): ToolHarness {
  const actions: MoveSelectionAction[] = [];
  const tool: MoveSelectionTool = new MoveSelectionTool((action) => actions.push(action));
  return { tool, actions };
}

describe('MoveSelectionTool', () => {
  it('emits nothing on mouse down', () => {
    const { tool, actions } = createTool();
    tool.mouseDown({ w: 20, h: 30 }, at(25, 35));
    expect(actions).toEqual([]);
  });

  it('moves the selection by the mouse delta from the remembered start offset while dragging', () => {
    const { tool, actions } = createTool();
    tool.mouseDown({ w: 20, h: 30 }, at(25, 35));
    tool.mouseMove(at(30, 36));
    tool.mouseMove(at(22, 40));

    expect(actions.length).toBe(2);
    expect(actions[0]).toBeInstanceOf(MoveSelectionAction);
    expect(positionOf(actions[0])).toEqual({ w: 25, h: 31 });
    expect(positionOf(actions[1])).toEqual({ w: 17, h: 35 });
  });

  it('ignores moves while the mouse is not down', () => {
    const { tool, actions } = createTool();
    tool.mouseMove(at(30, 36));
    expect(actions).toEqual([]);
  });

  it('emits the final position on mouse up and stops following the mouse', () => {
    const { tool, actions } = createTool();
    tool.mouseDown({ w: 20, h: 30 }, at(25, 35));
    tool.mouseUp(at(30, 36));
    expect(actions.length).toBe(1);
    expect(positionOf(actions[0])).toEqual({ w: 25, h: 31 });

    tool.mouseMove(at(50, 50));
    expect(actions.length).toBe(1);
  });

  it('remembers the position reached on mouse up as the current position', () => {
    const { tool } = createTool();
    tool.mouseDown({ w: 20, h: 30 }, at(25, 35));
    tool.mouseUp(at(30, 36));
    // The store passes the current selection offset on the next mouse down, so this is not observable
    // through the emitted actions; it is read directly to pin down the tool's own bookkeeping.
    expect(tool['_currentPosition']).toEqual({ w: 25, h: 31 });
  });

  it('starts every drag from the offset given on mouse down, not from the previous drag', () => {
    const { tool, actions } = createTool();
    tool.mouseDown({ w: 20, h: 30 }, at(25, 35));
    tool.mouseUp(at(30, 36));

    tool.mouseDown({ w: 0, h: 0 }, at(10, 10));
    tool.mouseMove(at(13, 14));
    expect(positionOf(actions[1])).toEqual({ w: 3, h: 4 });
  });
});

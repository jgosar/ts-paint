import { MoveSelectionAction } from './move-selection-action';
import { SetColorAction } from './set-color-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { imageFromMask, RED } from '../../../testing/image-test.helpers';
import { classesOf, execute, executeAndUndo } from '../../../testing/action-test.helpers';

function stateWithSelection(): TsPaintStoreState {
  return createTestState({ selectionImage: imageFromMask(['#']), selectionOffset: { w: 10, h: 20 } });
}

describe('MoveSelectionAction', () => {
  it('sets the selection offset without touching the image', () => {
    const state: TsPaintStoreState = stateWithSelection();

    const patches: Partial<TsPaintStoreState> = new MoveSelectionAction({ w: 30, h: 40 }).getStatePatches(state);

    expect(patches.selectionOffset).toEqual({ w: 30, h: 40 });
    expect(patches.image).toBeUndefined();
    expect('selectionImage' in patches).toBe(false);
  });

  it('undoes by moving back to the previous offset', () => {
    const state: TsPaintStoreState = stateWithSelection();
    const action: MoveSelectionAction = new MoveSelectionAction({ w: 30, h: 40 });

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([MoveSelectionAction]);
    expect(restored.selectionOffset).toEqual({ w: 10, h: 20 });
  });

  it('collapses successive moves into one history entry that undoes to the original offset', () => {
    const state: TsPaintStoreState = stateWithSelection();
    const firstMove: MoveSelectionAction = new MoveSelectionAction({ w: 30, h: 40 });
    const secondMove: MoveSelectionAction = new MoveSelectionAction({ w: 50, h: 60 });

    const afterFirst: TsPaintStoreState = execute(firstMove, state);
    const secondPatches: Partial<TsPaintStoreState> = secondMove.getStatePatches(afterFirst);

    expect(afterFirst.actions.length).toBe(1);
    expect(afterFirst.undoPointer).toBe(0);
    expect(secondPatches.actions.length).toBe(1);
    expect(secondPatches.actions[0]).toBe(secondMove);
    expect(secondPatches.undoPointer).toBe(0);
    expect(secondMove.undoActions).toBe(firstMove.undoActions);
    expect(secondMove.undoActions[0]['_newLocation']).toEqual({ w: 10, h: 20 });
  });

  it('does not collapse into a previous action of another type', () => {
    const state: TsPaintStoreState = stateWithSelection();
    const afterSetColor: TsPaintStoreState = execute(new SetColorAction({ color: RED, primary: true }), state);

    const patches: Partial<TsPaintStoreState> = new MoveSelectionAction({ w: 30, h: 40 }).getStatePatches(
      afterSetColor
    );

    expect(patches.actions.length).toBe(2);
    expect(patches.undoPointer).toBe(1);
  });
});

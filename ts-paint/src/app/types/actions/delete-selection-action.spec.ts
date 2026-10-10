import { DeleteSelectionAction } from './delete-selection-action';
import { PasteImageUndoAction } from './paste-image-undo-action';
import { MoveSelectionAction } from './move-selection-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { imageFromMask, maskOf } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

const SELECTION_MASK: string[] = ['#..', '##.'];

function stateWithSelection(): TsPaintStoreState {
  return createTestState({ selectionImage: imageFromMask(SELECTION_MASK), selectionOffset: { w: 10, h: 20 } });
}

describe('DeleteSelectionAction', () => {
  it('clears the selection without touching the image', () => {
    const state: TsPaintStoreState = stateWithSelection();

    const patches: Partial<TsPaintStoreState> = new DeleteSelectionAction().getStatePatches(state);

    expect(patches.selectionImage).toBeUndefined();
    expect('selectionImage' in patches).toBe(true);
    expect(patches.selectionOffset).toEqual({ w: 0, h: 0 });
    expect(patches.moveSelectionTool).toBeUndefined();
    expect(patches.image).toBeUndefined();
    expect(imagesEqual(state.image, createTestState().image)).toBe(true);
  });

  it('delete with no selection is a no-op', () => {
    const state: TsPaintStoreState = createTestState();
    const action: DeleteSelectionAction = new DeleteSelectionAction();
    let patches: Partial<TsPaintStoreState>;

    expect(() => (patches = action.getStatePatches(state))).not.toThrow();

    expect('selectionImage' in patches).toBe(false);
    expect(patches.image).toBeUndefined();
    expect(action.undoActions).toEqual([]);
  });

  it('undoes by re-selecting the deleted image part at its old offset', () => {
    const state: TsPaintStoreState = stateWithSelection();
    const action: DeleteSelectionAction = new DeleteSelectionAction();

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([PasteImageUndoAction, MoveSelectionAction]);
    expect(maskOf(restored.selectionImage)).toEqual(SELECTION_MASK);
    expect(restored.selectionOffset).toEqual({ w: 10, h: 20 });
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });
});

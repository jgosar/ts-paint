import { ClearImageAction } from './clear-image-action';
import { PasteImageAction } from './paste-image-action';
import { DeselectSelectionAction } from './deselect-selection-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { BLACK, BLUE, pointsOfColor, setPixel } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

function stateWithMark(): TsPaintStoreState {
  const state: TsPaintStoreState = createTestState({ secondaryColor: BLUE });
  setPixel(state.image, { w: 3, h: 4 }, BLACK);
  return state;
}

describe('ClearImageAction', () => {
  it('fills the whole image with the secondary color and keeps its size', () => {
    const state: TsPaintStoreState = stateWithMark();

    const patches: Partial<TsPaintStoreState> = new ClearImageAction().getStatePatches(state);

    expect(patches.image.width).toBe(100);
    expect(patches.image.height).toBe(100);
    expect(pointsOfColor(patches.image, BLUE).length).toBe(100 * 100);
    expect(patches.unsavedChanges).toBe(true);
  });

  it('deselects the selection before running', () => {
    expect(new ClearImageAction().deselectsSelection).toBe(true);
  });

  it('undoes by pasting the old image back and deselecting it', () => {
    const state: TsPaintStoreState = stateWithMark();
    const action: ClearImageAction = new ClearImageAction();

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([PasteImageAction, DeselectSelectionAction]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
    expect(restored.selectionImage).toBeUndefined();
  });
});

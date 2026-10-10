import { CropAction } from './crop-action';
import { PasteImageAction } from './paste-image-action';
import { DeselectSelectionAction } from './deselect-selection-action';
import { MoveSelectionAction } from './move-selection-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { imageFromMask, maskOf, RED, setPixel } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

const SELECTION_MASK: string[] = ['#..', '##.'];

function stateWithSelection(): TsPaintStoreState {
  const state: TsPaintStoreState = createTestState({
    selectionImage: imageFromMask(SELECTION_MASK),
    selectionOffset: { w: 10, h: 20 },
  });
  setPixel(state.image, { w: 50, h: 50 }, RED);
  return state;
}

describe('CropAction', () => {
  it('replaces the image with the selection and clears the selection', () => {
    const state: TsPaintStoreState = stateWithSelection();

    const patches: Partial<TsPaintStoreState> = new CropAction().getStatePatches(state);

    expect(patches.image.width).toBe(3);
    expect(patches.image.height).toBe(2);
    expect(maskOf(patches.image)).toEqual(SELECTION_MASK);
    expect(patches.selectionImage).toBeUndefined();
    expect(patches.selectionOffset).toEqual({ w: 0, h: 0 });
    expect(patches.moveSelectionTool).toBeUndefined();
    expect(patches.unsavedChanges).toBe(true);
  });

  it('does nothing without a selection', () => {
    const state: TsPaintStoreState = createTestState();

    const patches: Partial<TsPaintStoreState> = new CropAction().getStatePatches(state);

    expect(patches.image).toBeUndefined();
    expect('selectionImage' in patches).toBe(false);
    expect('unsavedChanges' in patches).toBe(false);
  });

  it('undoes by restoring the old image and re-selecting the cropped part at its old offset', () => {
    const state: TsPaintStoreState = stateWithSelection();
    const action: CropAction = new CropAction();

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([
      PasteImageAction,
      DeselectSelectionAction,
      PasteImageAction,
      MoveSelectionAction,
    ]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
    expect(maskOf(restored.selectionImage)).toEqual(SELECTION_MASK);
    expect(restored.selectionOffset).toEqual({ w: 10, h: 20 });
  });
});

import { DeselectSelectionAction } from './deselect-selection-action';
import { PasteImageAction } from './paste-image-action';
import { MoveSelectionAction } from './move-selection-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { BLACK, imageFromMask, isColor, maskOf, RED, setPixel, WHITE } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

const SELECTION_MASK: string[] = ['#..', '##.'];

function stateWithSelection(): TsPaintStoreState {
  const state: TsPaintStoreState = createTestState({
    selectionImage: imageFromMask(SELECTION_MASK),
    selectionOffset: { w: 10, h: 20 },
  });
  setPixel(state.image, { w: 11, h: 20 }, RED); // under the selection, gets covered
  return state;
}

describe('DeselectSelectionAction', () => {
  it('pastes the selection into the image at its offset and clears the selection', () => {
    const state: TsPaintStoreState = stateWithSelection();

    const patches: Partial<TsPaintStoreState> = new DeselectSelectionAction().getStatePatches(state);

    expect(isColor({ w: 10, h: 20 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 11, h: 20 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 11, h: 21 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 12, h: 21 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 13, h: 20 }, patches.image, WHITE)).toBe(true);
    expect(patches.selectionImage).toBeUndefined();
    expect(patches.selectionOffset).toEqual({ w: 0, h: 0 });
    expect(patches.moveSelectionTool).toBeUndefined();
  });

  it('does nothing without a selection', () => {
    const state: TsPaintStoreState = createTestState();

    const patches: Partial<TsPaintStoreState> = new DeselectSelectionAction().getStatePatches(state, false);

    expect(patches.image).toBeUndefined();
    expect('selectionImage' in patches).toBe(false);
  });

  it('exposes the patches that clear a selection', () => {
    expect(DeselectSelectionAction.getDeselectPatches()).toEqual({
      selectionImage: undefined,
      selectionOffset: { w: 0, h: 0 },
      moveSelectionTool: undefined,
    });
  });

  it('undoes by restoring the covered pixels and re-selecting the image part', () => {
    const state: TsPaintStoreState = stateWithSelection();
    const action: DeselectSelectionAction = new DeselectSelectionAction();

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([
      PasteImageAction,
      MoveSelectionAction,
      DeselectSelectionAction,
      PasteImageAction,
      MoveSelectionAction,
    ]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
    expect(isColor({ w: 11, h: 20 }, restored.image, RED)).toBe(true);
    expect(maskOf(restored.selectionImage)).toEqual(SELECTION_MASK);
    expect(restored.selectionOffset).toEqual({ w: 10, h: 20 });
  });
});

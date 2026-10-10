import { StretchImageAction } from './stretch-image-action';
import { PasteImageAction } from './paste-image-action';
import { MoveSelectionAction } from './move-selection-action';
import { CropAction } from './crop-action';
import { DeselectSelectionAction } from './deselect-selection-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { imageFromMask, maskOf } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

const MASK: string[] = ['#.', '.#'];
const DOUBLED_MASK: string[] = ['##..', '##..', '..##', '..##'];

describe('StretchImageAction', () => {
  it('upscales with crisp pixels and no smoothing', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new StretchImageAction({
      horizontal: 200,
      vertical: 200,
    }).getStatePatches(state);

    expect(patches.image.width).toBe(4);
    expect(patches.image.height).toBe(4);
    expect(maskOf(patches.image)).toEqual(DOUBLED_MASK);
    expect(patches.unsavedChanges).toBe(true);
  });

  it('stretches each direction on its own and treats a missing percentage as 100', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });

    const horizontal: Partial<TsPaintStoreState> = new StretchImageAction({ horizontal: 200 }).getStatePatches(state);
    const vertical: Partial<TsPaintStoreState> = new StretchImageAction({ vertical: 300 }).getStatePatches(state);

    expect(maskOf(horizontal.image)).toEqual(['##..', '..##']);
    expect(maskOf(vertical.image)).toEqual(['#.', '#.', '#.', '.#', '.#', '.#']);
  });

  it('downscales by picking pixels rather than blending them', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(DOUBLED_MASK) });

    const patches: Partial<TsPaintStoreState> = new StretchImageAction({
      horizontal: 50,
      vertical: 50,
    }).getStatePatches(state);

    expect(patches.image.width).toBe(2);
    expect(patches.image.height).toBe(2);
    expect(maskOf(patches.image)).toEqual(MASK);
  });

  it('stretches only the selection when there is one', () => {
    const state: TsPaintStoreState = createTestState({ selectionImage: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new StretchImageAction({
      horizontal: 200,
      vertical: 200,
    }).getStatePatches(state);

    expect(maskOf(patches.selectionImage)).toEqual(DOUBLED_MASK);
    expect(patches.image).toBeUndefined();
  });

  it('undoes an image stretch by pasting the old image back and cropping to it', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });
    const action: StretchImageAction = new StretchImageAction({ horizontal: 200, vertical: 200 });

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([PasteImageAction, CropAction, DeselectSelectionAction]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
    expect(restored.selectionImage).toBeUndefined();
  });

  it('undoes a selection stretch by re-selecting the old selection at its offset', () => {
    const state: TsPaintStoreState = createTestState({
      selectionImage: imageFromMask(MASK),
      selectionOffset: { w: 10, h: 20 },
    });
    const action: StretchImageAction = new StretchImageAction({ horizontal: 200, vertical: 200 });

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([PasteImageAction, MoveSelectionAction]);
    expect(maskOf(restored.selectionImage)).toEqual(MASK);
    expect(restored.selectionOffset).toEqual({ w: 10, h: 20 });
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });
});

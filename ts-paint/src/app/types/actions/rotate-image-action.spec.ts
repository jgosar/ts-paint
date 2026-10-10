import { RotateImageAction } from './rotate-image-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { imageFromMask, maskOf } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

const MASK: string[] = ['#..', '##.'];

describe('RotateImageAction', () => {
  it('rotates the image by 90 degrees clockwise and swaps its dimensions', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new RotateImageAction(90).getStatePatches(state);

    expect(patches.image.width).toBe(2);
    expect(patches.image.height).toBe(3);
    expect(maskOf(patches.image)).toEqual(['##', '#.', '..']);
    expect(patches.unsavedChanges).toBe(true);
  });

  it('rotates the image by 180 degrees and keeps its dimensions', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new RotateImageAction(180).getStatePatches(state);

    expect(patches.image.width).toBe(3);
    expect(patches.image.height).toBe(2);
    expect(maskOf(patches.image)).toEqual(['.##', '..#']);
  });

  it('rotates the image by 270 degrees clockwise and swaps its dimensions', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new RotateImageAction(270).getStatePatches(state);

    expect(patches.image.width).toBe(2);
    expect(patches.image.height).toBe(3);
    expect(maskOf(patches.image)).toEqual(['..', '.#', '##']);
  });

  it('rotates only the selection when there is one', () => {
    const state: TsPaintStoreState = createTestState({ selectionImage: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new RotateImageAction(90).getStatePatches(state);

    expect(maskOf(patches.selectionImage)).toEqual(['##', '#.', '..']);
    expect(patches.image).toBeUndefined();
  });

  it('undoes by rotating the rest of the way round', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });
    const action: RotateImageAction = new RotateImageAction(90);

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([RotateImageAction]);
    expect(action.undoActions[0]['_angle']).toBe(270);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });

  it('undoes a 180 degree rotation with another 180 degree rotation', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });
    const action: RotateImageAction = new RotateImageAction(180);

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(action.undoActions[0]['_angle']).toBe(180);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });
});

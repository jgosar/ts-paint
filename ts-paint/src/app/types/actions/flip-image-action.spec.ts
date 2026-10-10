import { FlipImageAction } from './flip-image-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { imageFromMask, maskOf } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

const MASK: string[] = ['#..', '##.'];

describe('FlipImageAction', () => {
  it('mirrors the image horizontally', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new FlipImageAction('horizontal').getStatePatches(state);

    expect(maskOf(patches.image)).toEqual(['..#', '.##']);
    expect(patches.unsavedChanges).toBe(true);
  });

  it('mirrors the image vertically', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new FlipImageAction('vertical').getStatePatches(state);

    expect(maskOf(patches.image)).toEqual(['##.', '#..']);
  });

  it('flips only the selection when there is one', () => {
    const state: TsPaintStoreState = createTestState({ selectionImage: imageFromMask(MASK) });

    const patches: Partial<TsPaintStoreState> = new FlipImageAction('horizontal').getStatePatches(state);

    expect(maskOf(patches.selectionImage)).toEqual(['..#', '.##']);
    expect(patches.image).toBeUndefined();
  });

  it('undoes with the same flip', () => {
    const state: TsPaintStoreState = createTestState({ image: imageFromMask(MASK) });
    const action: FlipImageAction = new FlipImageAction('vertical');

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([FlipImageAction]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });

  it('undoes a selection flip in the selection', () => {
    const state: TsPaintStoreState = createTestState({ selectionImage: imageFromMask(MASK) });
    const action: FlipImageAction = new FlipImageAction('horizontal');

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(maskOf(restored.selectionImage)).toEqual(MASK);
  });
});

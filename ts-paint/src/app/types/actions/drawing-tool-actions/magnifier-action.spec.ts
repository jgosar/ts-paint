import { MagnifierAction } from './magnifier-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../../testing/state.factory';
import { alphaAt, isColor, WHITE } from '../../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../../testing/action-test.helpers';

function createState(): TsPaintStoreState {
  return createTestState({ zoom: 1, viewportSize: { w: 40, h: 20 }, scrollPosition: { w: 0, h: 0 } });
}

describe('MagnifierAction', () => {
  it('previews the viewport after zooming in as a white rectangle around the mouse', () => {
    const action: MagnifierAction = new MagnifierAction([{ w: 50, h: 50 }], false, 'preview');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    // at zoom 2 the 40x20 viewport shows 20x10 image pixels, i.e. 10 and 5 to each side of the mouse
    expect(patches.previewOffset).toEqual({ w: 40, h: 45 });
    expect(patches.previewImage.width).toBe(21);
    expect(patches.previewImage.height).toBe(11);
    expect(isColor({ w: 0, h: 0 }, patches.previewImage, WHITE)).toBe(true);
    expect(alphaAt({ w: 0, h: 0 }, patches.previewImage)).toBe(255);
    expect(isColor({ w: 20, h: 10 }, patches.previewImage, WHITE)).toBe(true);
    expect(alphaAt({ w: 20, h: 10 }, patches.previewImage)).toBe(255);
    expect(alphaAt({ w: 10, h: 5 }, patches.previewImage)).toBe(0);
    expect('zoom' in patches).toBe(false);
  });

  it('keeps the previewed viewport inside the image', () => {
    const action: MagnifierAction = new MagnifierAction([{ w: 5, h: 2 }], false, 'preview');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(patches.previewOffset).toEqual({ w: 0, h: 0 });
    expect(patches.previewImage.width).toBe(16);
    expect(patches.previewImage.height).toBe(8);
  });

  it('doubles the zoom with the left button and scrolls so the mouse is centred', () => {
    const state: TsPaintStoreState = createState();
    const action: MagnifierAction = new MagnifierAction([{ w: 50, h: 50 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.zoom).toBe(2);
    expect(patches.scrollPosition).toEqual({ w: 80, h: 90 });
    expect(imagesEqual(patches.image, state.image)).toBe(true);
  });

  it('halves the zoom with the right button', () => {
    const action: MagnifierAction = new MagnifierAction([{ w: 50, h: 50 }], true, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(patches.zoom).toBe(0.5);
    expect(patches.scrollPosition).toEqual({ w: 5, h: 15 });
  });

  it('never scrolls to a negative position', () => {
    const action: MagnifierAction = new MagnifierAction([{ w: 2, h: 2 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(patches.scrollPosition).toEqual({ w: 0, h: 0 });
  });

  it('undoes by zooming the other way at the same point', () => {
    const state: TsPaintStoreState = createState();
    const action: MagnifierAction = new MagnifierAction([{ w: 50, h: 50 }], false, 'image');

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([MagnifierAction]);
    expect((<MagnifierAction>action.undoActions[0]).swapColors).toBe(true);
    expect((<MagnifierAction>action.undoActions[0]).points).toEqual([{ w: 50, h: 50 }]);
    expect(restored.zoom).toBe(1);
  });
});

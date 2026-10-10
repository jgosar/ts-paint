import { ResizeImageAction } from './resize-image-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { BLACK, BLUE, isColor, setPixel } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

function stateWithMark(): TsPaintStoreState {
  const state: TsPaintStoreState = createTestState({ secondaryColor: BLUE });
  setPixel(state.image, { w: 3, h: 4 }, BLACK);
  return state;
}

describe('ResizeImageAction', () => {
  it('pads a grown image with the secondary color and keeps the old pixels', () => {
    const state: TsPaintStoreState = stateWithMark();

    const patches: Partial<TsPaintStoreState> = new ResizeImageAction(120, 110).getStatePatches(state);

    expect(patches.image.width).toBe(120);
    expect(patches.image.height).toBe(110);
    expect(isColor({ w: 3, h: 4 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 99, h: 99 }, patches.image, { r: 255, g: 255, b: 255 })).toBe(true);
    expect(isColor({ w: 100, h: 0 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 0, h: 100 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 119, h: 109 }, patches.image, BLUE)).toBe(true);
    expect(patches.unsavedChanges).toBe(true);
  });

  it('crops a shrunk image at the top left corner', () => {
    const state: TsPaintStoreState = stateWithMark();

    const patches: Partial<TsPaintStoreState> = new ResizeImageAction(10, 10).getStatePatches(state);

    expect(patches.image.width).toBe(10);
    expect(patches.image.height).toBe(10);
    expect(isColor({ w: 3, h: 4 }, patches.image, BLACK)).toBe(true);
  });

  it('deselects the selection before running', () => {
    expect(new ResizeImageAction(10, 10).deselectsSelection).toBe(true);
  });

  it('undoes a grow by resizing back to the old size, which restores the old pixels', () => {
    const state: TsPaintStoreState = stateWithMark();
    const action: ResizeImageAction = new ResizeImageAction(120, 110);

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([ResizeImageAction]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });

  it('undoes a shrink by resizing back to the old size', () => {
    const state: TsPaintStoreState = stateWithMark();
    const action: ResizeImageAction = new ResizeImageAction(10, 10);

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(restored.image.width).toBe(100);
    expect(restored.image.height).toBe(100);
    expect(isColor({ w: 3, h: 4 }, restored.image, BLACK)).toBe(true);
  });
});

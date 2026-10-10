import { InvertColorsAction } from './invert-colors-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import {
  alphaAt,
  BLACK,
  GREEN,
  imageFromMask,
  isColor,
  maskOf,
  RED,
  setPixel,
} from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

describe('InvertColorsAction', () => {
  it('replaces every RGB channel by 255 minus its value and keeps the alpha', () => {
    const state: TsPaintStoreState = createTestState();
    setPixel(state.image, { w: 1, h: 1 }, RED);
    setPixel(state.image, { w: 2, h: 2 }, GREEN, 100);

    const patches: Partial<TsPaintStoreState> = new InvertColorsAction().getStatePatches(state);

    expect(isColor({ w: 0, h: 0 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 1, h: 1 }, patches.image, { r: 0, g: 255, b: 255 })).toBe(true);
    expect(isColor({ w: 2, h: 2 }, patches.image, { r: 255, g: 127, b: 255 })).toBe(true);
    expect(alphaAt({ w: 2, h: 2 }, patches.image)).toBe(100);
    expect(alphaAt({ w: 0, h: 0 }, patches.image)).toBe(255);
  });

  it('inverts only the selection when there is one', () => {
    const state: TsPaintStoreState = createTestState({ selectionImage: imageFromMask(['#.', '..']) });

    const patches: Partial<TsPaintStoreState> = new InvertColorsAction().getStatePatches(state);

    expect(maskOf(patches.selectionImage)).toEqual(['.#', '##']);
    expect(patches.image).toBeUndefined();
  });

  it('undoes by inverting again', () => {
    const state: TsPaintStoreState = createTestState();
    setPixel(state.image, { w: 1, h: 1 }, RED, 100);
    const action: InvertColorsAction = new InvertColorsAction();

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([InvertColorsAction]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });
});

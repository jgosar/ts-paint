import { PencilAction } from './pencil-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../../testing/state.factory';
import { alphaAt, BLUE, isColor, RED, WHITE } from '../../../../testing/image-test.helpers';

function createState(): TsPaintStoreState {
  return createTestState({ primaryColor: RED, secondaryColor: BLUE });
}

describe('PencilAction', () => {
  it('draws a 1 px line through the mouse points in the primary color', () => {
    const action: PencilAction = new PencilAction(
      [
        { w: 10, h: 10 },
        { w: 14, h: 14 },
        { w: 14, h: 16 },
      ],
      false,
      'image'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    for (let i = 0; i <= 4; i++) {
      expect(isColor({ w: 10 + i, h: 10 + i }, patches.image, RED), `(${10 + i},${10 + i})`).toBe(true);
    }
    expect(isColor({ w: 14, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 14, h: 16 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 11, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 10, h: 11 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 15, h: 17 }, patches.image, WHITE)).toBe(true);
  });

  it('draws a single click as one pixel', () => {
    const action: PencilAction = new PencilAction([{ w: 10, h: 10 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(isColor({ w: 10, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 11, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 9, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 10, h: 11 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 10, h: 9 }, patches.image, WHITE)).toBe(true);
  });

  it('draws with the secondary color for the right button', () => {
    const action: PencilAction = new PencilAction([{ w: 10, h: 10 }], true, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(isColor({ w: 10, h: 10 }, patches.image, BLUE)).toBe(true);
  });

  it('previews the line on a transparent image covering the mouse points', () => {
    const action: PencilAction = new PencilAction(
      [
        { w: 10, h: 10 },
        { w: 14, h: 14 },
      ],
      false,
      'preview'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(patches.previewOffset).toEqual({ w: 10, h: 10 });
    expect(patches.previewImage.width).toBe(5);
    expect(patches.previewImage.height).toBe(5);
    expect(isColor({ w: 0, h: 0 }, patches.previewImage, RED)).toBe(true);
    expect(isColor({ w: 4, h: 4 }, patches.previewImage, RED)).toBe(true);
    expect(alphaAt({ w: 4, h: 0 }, patches.previewImage)).toBe(0);
  });
});

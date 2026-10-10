import { ColorFillerAction } from './color-filler-action';
import { PasteImageAction } from '../paste-image-action';
import { MoveSelectionAction } from '../move-selection-action';
import { DeselectSelectionAction } from '../deselect-selection-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../../testing/state.factory';
import {
  alphaAt,
  BLACK,
  BLUE,
  imageFromMask,
  isColor,
  maskOf,
  RED,
  setPixel,
  WHITE,
} from '../../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../../testing/action-test.helpers';

/** A diamond whose black pixels only touch diagonally: a 4-connected fill of the inside must not leak out */
const DIAMOND: string[] = ['..#..', '.#.#.', '#...#', '.#.#.', '..#..'];

function diamondState(): TsPaintStoreState {
  return createTestState({ image: imageFromMask(DIAMOND), primaryColor: RED, secondaryColor: BLUE });
}

describe('ColorFillerAction', () => {
  it('fills the 4-connected area of the clicked color without leaking through diagonal gaps', () => {
    const action: ColorFillerAction = new ColorFillerAction([{ w: 2, h: 2 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(diamondState());

    expect(maskOf(patches.image, RED)).toEqual(['.....', '..#..', '.###.', '..#..', '.....']);
    expect(maskOf(patches.image, BLACK)).toEqual(DIAMOND);
    expect(isColor({ w: 0, h: 0 }, patches.image, WHITE)).toBe(true);
  });

  it('fills with the secondary color for the right button', () => {
    const action: ColorFillerAction = new ColorFillerAction([{ w: 0, h: 0 }], true, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(diamondState());

    // the diamond touches the edges, so the top left corner is its own 4-connected region
    expect(isColor({ w: 0, h: 0 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 1, h: 0 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 0, h: 1 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 4, h: 4 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 2, h: 2 }, patches.image, WHITE)).toBe(true);
  });

  it('only fills pixels with exactly the same RGB', () => {
    const state: TsPaintStoreState = createTestState({ primaryColor: BLACK });
    setPixel(state.image, { w: 0, h: 0 }, { r: 254, g: 255, b: 255 });
    const action: ColorFillerAction = new ColorFillerAction([{ w: 50, h: 50 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isColor({ w: 0, h: 0 }, patches.image, { r: 254, g: 255, b: 255 })).toBe(true);
    expect(isColor({ w: 1, h: 0 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 99, h: 99 }, patches.image, BLACK)).toBe(true);
  });

  it('limits the affected area to the bounding box of the filled pixels', () => {
    const action: ColorFillerAction = new ColorFillerAction([{ w: 2, h: 2 }], false, 'image');

    action.getStatePatches(diamondState());

    expect(classesOf(action.undoActions)).toEqual([PasteImageAction, MoveSelectionAction, DeselectSelectionAction]);
    expect(action.undoActions[0]['_imagePart'].width).toBe(3);
    expect(action.undoActions[0]['_imagePart'].height).toBe(3);
    expect(action.undoActions[1]['_newLocation']).toEqual({ w: 1, h: 1 });
  });

  it('undo restores the filled pixels', () => {
    const state: TsPaintStoreState = diamondState();
    const action: ColorFillerAction = new ColorFillerAction([{ w: 2, h: 2 }], false, 'image');

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });

  it('previews on the real pixels of the affected area', () => {
    const action: ColorFillerAction = new ColorFillerAction([{ w: 2, h: 2 }], false, 'preview');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(diamondState());

    expect(patches.previewOffset).toEqual({ w: 1, h: 1 });
    expect(patches.previewImage.width).toBe(3);
    expect(patches.previewImage.height).toBe(3);
    expect(isColor({ w: 0, h: 0 }, patches.previewImage, BLACK)).toBe(true);
    expect(alphaAt({ w: 0, h: 0 }, patches.previewImage)).toBe(255);
    expect(alphaAt({ w: 1, h: 1 }, patches.previewImage)).toBe(255);
  });

  it("filling with the pixel's own color is a no-op and does not produce a NaN area", () => {
    const state: TsPaintStoreState = createTestState({ primaryColor: WHITE });
    const action: ColorFillerAction = new ColorFillerAction([{ w: 5, h: 7 }], false, 'image');
    let patches: Partial<TsPaintStoreState>;

    expect(() => (patches = action.getStatePatches(state))).not.toThrow();

    expect(imagesEqual(patches.image, state.image)).toBe(true);
    expect(action.undoActions[0]['_imagePart'].width).toBe(1);
    expect(action.undoActions[0]['_imagePart'].height).toBe(1);
    expect(action.undoActions[1]['_newLocation']).toEqual({ w: 5, h: 7 });
  });
});

import { PasteImageUndoAction } from './paste-image-undo-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { BLACK, BLUE, imageFromMask, isColor, setPixel } from '../../../testing/image-test.helpers';
import { createImage } from '../../helpers/image.helpers';

describe('PasteImageUndoAction', () => {
  it('selects the pasted image at the given position without changing the image', () => {
    const state: TsPaintStoreState = createTestState();
    const part: ImageData = imageFromMask(['#.', '.#']);

    const patches: Partial<TsPaintStoreState> = new PasteImageUndoAction(part, { w: 5, h: 6 }).getStatePatches(state);

    expect(patches.selectionImage).toBe(part);
    expect(patches.selectionOffset).toEqual({ w: 5, h: 6 });
    expect(patches.moveSelectionTool).toBeUndefined();
    expect(patches.image).toBeUndefined();
  });

  it('pastes at the top left corner by default', () => {
    const patches: Partial<TsPaintStoreState> = new PasteImageUndoAction(imageFromMask(['#'])).getStatePatches(
      createTestState()
    );

    expect(patches.selectionOffset).toEqual({ w: 0, h: 0 });
  });

  it('grows the canvas with the secondary color when the pasted image is bigger', () => {
    const state: TsPaintStoreState = createTestState({ secondaryColor: BLUE });
    setPixel(state.image, { w: 99, h: 99 }, BLACK);

    const patches: Partial<TsPaintStoreState> = new PasteImageUndoAction(createImage(120, 50)).getStatePatches(state);

    expect(patches.image.width).toBe(120);
    expect(patches.image.height).toBe(100);
    expect(isColor({ w: 99, h: 99 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 100, h: 0 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 119, h: 99 }, patches.image, BLUE)).toBe(true);
  });

  it('has no undo actions of its own', () => {
    const action: PasteImageUndoAction = new PasteImageUndoAction(imageFromMask(['#']));

    action.getStatePatches(createTestState());

    expect(action.undoActions).toEqual([]);
    expect(action.deselectsSelection).toBe(true);
  });
});

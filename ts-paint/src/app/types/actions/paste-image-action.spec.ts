import { PasteImageAction } from './paste-image-action';
import { DeleteSelectionAction } from './delete-selection-action';
import { ResizeImageAction } from './resize-image-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { BLACK, BLUE, imageFromMask, isColor, setPixel } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';
import { createImage } from '../../helpers/image.helpers';

describe('PasteImageAction', () => {
  it('selects the pasted image at the given position', () => {
    const state: TsPaintStoreState = createTestState();
    const part: ImageData = imageFromMask(['#.', '.#']);

    const patches: Partial<TsPaintStoreState> = new PasteImageAction(part, { w: 5, h: 6 }).getStatePatches(state);

    expect(patches.selectionImage).toBe(part);
    expect(patches.selectionOffset).toEqual({ w: 5, h: 6 });
    expect(patches.image).toBeUndefined();
  });

  it('grows the canvas with the secondary color when the pasted image is bigger', () => {
    const state: TsPaintStoreState = createTestState({ secondaryColor: BLUE });

    const patches: Partial<TsPaintStoreState> = new PasteImageAction(createImage(50, 130)).getStatePatches(state);

    expect(patches.image.width).toBe(100);
    expect(patches.image.height).toBe(130);
    expect(isColor({ w: 0, h: 100 }, patches.image, BLUE)).toBe(true);
  });

  it('undoes by deleting the selection and resizing back to the old size', () => {
    const state: TsPaintStoreState = createTestState({ secondaryColor: BLUE });
    setPixel(state.image, { w: 99, h: 99 }, BLACK);
    const action: PasteImageAction = new PasteImageAction(createImage(120, 130));

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([DeleteSelectionAction, ResizeImageAction]);
    expect(restored.selectionImage).toBeUndefined();
    expect(imagesEqual(restored.image, state.image)).toBe(true);
  });
});

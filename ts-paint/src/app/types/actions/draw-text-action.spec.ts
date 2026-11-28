import { DrawTextAction } from './draw-text-action';
import { PasteImageAction } from './paste-image-action';
import { MoveSelectionAction } from './move-selection-action';
import { DeselectSelectionAction } from './deselect-selection-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { applyActions, classesOf, execute, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';
import { createImage } from '../../helpers/image.helpers';
import { BLUE, isColor, RED, setPixel, WHITE } from '../../../testing/image-test.helpers';

/** A 3x2 rendered text box: red text pixels at (0,0) and (2,1), transparent elsewhere */
function textImage(): ImageData {
  const image: ImageData = new ImageData(3, 2);
  setPixel(image, { w: 0, h: 0 }, RED);
  setPixel(image, { w: 2, h: 1 }, RED);
  return image;
}

function stateWithTextBox(): TsPaintStoreState {
  const state: TsPaintStoreState = createTestState({
    textBox: { area: { start: { w: 10, h: 20 }, end: { w: 12, h: 21 } }, text: 'x' },
  });
  setPixel(state.image, { w: 11, h: 20 }, BLUE); // under a transparent pixel of the text
  return state;
}

describe('DrawTextAction', () => {
  it('blends the text into the image at its offset and closes the text box', () => {
    const after: TsPaintStoreState = execute(new DrawTextAction(textImage(), { w: 10, h: 20 }), stateWithTextBox());

    expect(isColor({ w: 10, h: 20 }, after.image, RED)).toBe(true);
    expect(isColor({ w: 12, h: 21 }, after.image, RED)).toBe(true);
    expect(isColor({ w: 11, h: 20 }, after.image, BLUE), 'the background shows through').toBe(true);
    expect(isColor({ w: 13, h: 20 }, after.image, WHITE)).toBe(true);
    expect(after.textBox).toBeUndefined();
    expect(after.unsavedChanges).toBe(true);
  });

  it('is one undo step that restores the pixels under the text', () => {
    const before: TsPaintStoreState = stateWithTextBox();
    const action: DrawTextAction = new DrawTextAction(textImage(), { w: 10, h: 20 });

    const restored: TsPaintStoreState = executeAndUndo(action, before);

    expect(classesOf(action.undoActions)).toEqual([PasteImageAction, MoveSelectionAction, DeselectSelectionAction]);
    expect(imagesEqual(restored.image, before.image)).toBe(true);
    expect(restored.selectionImage).toBeUndefined();
  });

  it('repeats with the same pixels', () => {
    const before: TsPaintStoreState = stateWithTextBox();
    const action: DrawTextAction = new DrawTextAction(textImage(), { w: 10, h: 20 });
    const drawn: TsPaintStoreState = execute(action, before);
    const undone: TsPaintStoreState = applyActions(drawn, action.undoActions);

    const repeated: TsPaintStoreState = applyActions(undone, [action]);

    expect(imagesEqual(repeated.image, drawn.image)).toBe(true);
  });

  it('draws opaque text boxes over everything', () => {
    const opaque: ImageData = createImage(3, 2, WHITE);
    setPixel(opaque, { w: 0, h: 0 }, RED);

    const after: TsPaintStoreState = execute(new DrawTextAction(opaque, { w: 10, h: 20 }), stateWithTextBox());

    expect(isColor({ w: 11, h: 20 }, after.image, WHITE)).toBe(true);
    expect(isColor({ w: 10, h: 20 }, after.image, RED)).toBe(true);
  });
});

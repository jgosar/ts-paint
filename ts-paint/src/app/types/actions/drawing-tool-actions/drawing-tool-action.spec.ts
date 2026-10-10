import { DrawingToolAction } from './drawing-tool-action';
import { PasteImageAction } from '../paste-image-action';
import { MoveSelectionAction } from '../move-selection-action';
import { DeselectSelectionAction } from '../deselect-selection-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { setPixelInOriginalImage } from '../../../helpers/drawing.helpers';
import { createTestState } from '../../../../testing/state.factory';
import { alphaAt, BLACK, BLUE, isColor, RED, setPixel, WHITE } from '../../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../../testing/action-test.helpers';

/** Paints every point with color1, except the last one which gets color2 */
class DotsAction extends DrawingToolAction {
  public receivedColors: { color1: Color; color2: Color };

  protected draw(points: Point[], color1: Color, color2: Color, image: ImageData) {
    this.receivedColors = { color1, color2 };
    points.forEach((point, index) => {
      setPixelInOriginalImage(point, index === points.length - 1 ? color2 : color1, image);
    });
  }
}

const POINTS: Point[] = [
  { w: 10, h: 20 },
  { w: 30, h: 5 },
];

function createState(): TsPaintStoreState {
  return createTestState({ primaryColor: RED, secondaryColor: BLUE });
}

describe('DrawingToolAction', () => {
  it('draws into a copy of the image at the absolute points', () => {
    const state: TsPaintStoreState = createState();
    const action: DotsAction = new DotsAction(POINTS, false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isColor({ w: 10, h: 20 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 30, h: 5 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 10, h: 20 }, state.image, WHITE)).toBe(true);
    expect(patches.unsavedChanges).toBe(true);
    expect(patches.previewImage.width).toBe(1);
    expect(patches.previewAction).toBeUndefined();
  });

  it('uses the primary color as color1 and the secondary color as color2 for the left button', () => {
    const action: DotsAction = new DotsAction(POINTS, false, 'image');

    action.getStatePatches(createState());

    expect(action.receivedColors).toEqual({ color1: RED, color2: BLUE });
  });

  it('swaps the colors for the right button', () => {
    const action: DotsAction = new DotsAction(POINTS, true, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(action.receivedColors).toEqual({ color1: BLUE, color2: RED });
    expect(isColor({ w: 10, h: 20 }, patches.image, BLUE)).toBe(true);
  });

  it('previews on a transparent image the size of the bounding box with the points shifted into it', () => {
    const state: TsPaintStoreState = createState();
    const action: DotsAction = new DotsAction(POINTS, false, 'preview');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.previewOffset).toEqual({ w: 10, h: 5 });
    expect(patches.previewImage.width).toBe(21);
    expect(patches.previewImage.height).toBe(16);
    expect(isColor({ w: 0, h: 15 }, patches.previewImage, RED)).toBe(true);
    expect(isColor({ w: 20, h: 0 }, patches.previewImage, BLUE)).toBe(true);
    expect(alphaAt({ w: 5, h: 5 }, patches.previewImage)).toBe(0);
    expect(patches.previewAction).toBe(action);
    expect(patches.image).toBeUndefined();
    expect('actions' in patches).toBe(false);
    expect(action.undoActions).toEqual([]);
  });

  it('deselects the selection before drawing', () => {
    expect(new DotsAction(POINTS, false, 'image').deselectsSelection).toBe(true);
  });

  it('undoes by pasting the old bounding box back, moving it into place and deselecting', () => {
    const state: TsPaintStoreState = createState();
    setPixel(state.image, { w: 30, h: 5 }, BLACK);
    const action: DotsAction = new DotsAction(POINTS, false, 'image');

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([PasteImageAction, MoveSelectionAction, DeselectSelectionAction]);
    expect(action.undoActions[0]['_imagePart'].width).toBe(21);
    expect(action.undoActions[0]['_imagePart'].height).toBe(16);
    expect(action.undoActions[1]['_newLocation']).toEqual({ w: 10, h: 5 });
    expect(imagesEqual(restored.image, state.image)).toBe(true);
    expect(restored.selectionImage).toBeUndefined();
  });
});

import { RectangleSelectAction } from './rectangle-select-action';
import { PasteImageAction } from '../paste-image-action';
import { MoveSelectionAction } from '../move-selection-action';
import { DeselectSelectionAction } from '../deselect-selection-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { Point } from '../../base/point';
import { createTestState } from '../../../../testing/state.factory';
import { alphaAt, BLUE, isColor, pointsOfColor, RED, setPixel, WHITE } from '../../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../../testing/action-test.helpers';

const BOX: Point[] = [
  { w: 10, h: 10 },
  { w: 20, h: 20 },
];

function createState(zoom: number = 1): TsPaintStoreState {
  const state: TsPaintStoreState = createTestState({ zoom, secondaryColor: BLUE });
  setPixel(state.image, { w: 12, h: 12 }, RED);
  return state;
}

describe('RectangleSelectAction', () => {
  it('previews a dashed white rectangle with 4 px dashes at zoom 1', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleSelectAction(BOX, false, 'preview').getStatePatches(
      createState(1)
    );

    expect(patches.previewOffset).toEqual({ w: 10, h: 10 });
    expect(patches.previewImage.width).toBe(11);
    expect(patches.previewImage.height).toBe(11);
    // left edge runs from the top: 4 on, 4 off, then on until the corner
    for (let h = 0; h <= 3; h++) {
      expect(isColor({ w: 0, h }, patches.previewImage, WHITE), `(0,${h})`).toBe(true);
      expect(alphaAt({ w: 0, h }, patches.previewImage), `(0,${h})`).toBe(255);
    }
    for (let h = 4; h <= 7; h++) {
      expect(alphaAt({ w: 0, h }, patches.previewImage), `(0,${h})`).toBe(0);
    }
    expect(alphaAt({ w: 0, h: 8 }, patches.previewImage)).toBe(255);
    // bottom edge runs from the left
    expect(alphaAt({ w: 3, h: 10 }, patches.previewImage)).toBe(255);
    expect(alphaAt({ w: 4, h: 10 }, patches.previewImage)).toBe(0);
    expect(alphaAt({ w: 5, h: 5 }, patches.previewImage)).toBe(0);
    expect('selectionImage' in patches).toBe(false);
  });

  it('shortens the dashes to ceil(4 / zoom) pixels', () => {
    const atZoom2: Partial<TsPaintStoreState> = new RectangleSelectAction(BOX, false, 'preview').getStatePatches(
      createState(2)
    );
    const atZoom3: Partial<TsPaintStoreState> = new RectangleSelectAction(BOX, false, 'preview').getStatePatches(
      createState(3)
    );

    expect(alphaAt({ w: 0, h: 1 }, atZoom2.previewImage)).toBe(255);
    expect(alphaAt({ w: 0, h: 2 }, atZoom2.previewImage)).toBe(0);
    expect(alphaAt({ w: 0, h: 3 }, atZoom2.previewImage)).toBe(0);
    expect(alphaAt({ w: 0, h: 4 }, atZoom2.previewImage)).toBe(255);
    expect(alphaAt({ w: 0, h: 1 }, atZoom3.previewImage)).toBe(255);
    expect(alphaAt({ w: 0, h: 2 }, atZoom3.previewImage)).toBe(0);
    expect(alphaAt({ w: 0, h: 4 }, atZoom3.previewImage)).toBe(255);
  });

  it('cuts the area out into the selection and fills it with the secondary color', () => {
    const state: TsPaintStoreState = createState();

    const patches: Partial<TsPaintStoreState> = new RectangleSelectAction(BOX, false, 'image').getStatePatches(state);

    expect(patches.selectionImage.width).toBe(11);
    expect(patches.selectionImage.height).toBe(11);
    expect(isColor({ w: 2, h: 2 }, patches.selectionImage, RED)).toBe(true);
    expect(pointsOfColor(patches.selectionImage, WHITE).length).toBe(11 * 11 - 1);
    expect(patches.selectionOffset).toEqual({ w: 10, h: 10 });
    expect(pointsOfColor(patches.image, BLUE).length).toBe(11 * 11);
    expect(isColor({ w: 10, h: 10 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 20, h: 20 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 9, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 21, h: 21 }, patches.image, WHITE)).toBe(true);
  });

  it('puts the selection offset at the top left corner however the box was dragged', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleSelectAction(
      [
        { w: 20, h: 10 },
        { w: 10, h: 20 },
      ],
      false,
      'image'
    ).getStatePatches(createState());

    expect(patches.selectionOffset).toEqual({ w: 10, h: 10 });
    expect(isColor({ w: 2, h: 2 }, patches.selectionImage, RED)).toBe(true);
  });

  it('undoes by pasting the cut out pixels back and deselecting', () => {
    const state: TsPaintStoreState = createState();
    const action: RectangleSelectAction = new RectangleSelectAction(BOX, false, 'image');

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([PasteImageAction, MoveSelectionAction, DeselectSelectionAction]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
    expect(restored.selectionImage).toBeUndefined();
  });
});

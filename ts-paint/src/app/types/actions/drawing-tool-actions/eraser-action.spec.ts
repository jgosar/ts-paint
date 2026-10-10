import { EraserAction } from './eraser-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { createImage } from '../../../helpers/image.helpers';
import { DEFAULT_DRAWING_TOOL_OPTIONS } from '../../../services/ts-paint/ts-paint.config';
import { createTestState } from '../../../../testing/state.factory';
import { BLACK, BLUE, isColor, RED, setPixel, WHITE } from '../../../../testing/image-test.helpers';

function stateWithEraserSize(size: number): TsPaintStoreState {
  return createTestState({
    image: createImage(100, 100, BLACK),
    primaryColor: RED,
    secondaryColor: BLUE,
    drawingToolOptions: { ...DEFAULT_DRAWING_TOOL_OPTIONS, [DrawingToolType.eraser]: { size } },
  });
}

describe('EraserAction', () => {
  it('paints the secondary color in a square around the mouse path', () => {
    const state: TsPaintStoreState = stateWithEraserSize(8);
    const action: EraserAction = new EraserAction(
      [
        { w: 20, h: 50 },
        { w: 30, h: 50 },
      ],
      false,
      'image'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    // size 8 extends 3 px before and 4 px after the mouse pixel
    expect(isColor({ w: 17, h: 47 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 34, h: 54 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 16, h: 50 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 35, h: 50 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 25, h: 46 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 25, h: 55 }, patches.image, BLACK)).toBe(true);
  });

  it('erases a single click as one square stamp', () => {
    const state: TsPaintStoreState = stateWithEraserSize(4);
    const action: EraserAction = new EraserAction([{ w: 10, h: 10 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isColor({ w: 9, h: 9 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 12, h: 12 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 8, h: 10 }, patches.image, BLACK)).toBe(true);
    expect(isColor({ w: 13, h: 10 }, patches.image, BLACK)).toBe(true);
  });

  it('pads the preview by the eraser size and paints it with the secondary color', () => {
    const state: TsPaintStoreState = stateWithEraserSize(8);
    const action: EraserAction = new EraserAction(
      [
        { w: 20, h: 50 },
        { w: 30, h: 50 },
      ],
      false,
      'preview'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.previewOffset).toEqual({ w: 17, h: 47 });
    expect(patches.previewImage.width).toBe(18);
    expect(patches.previewImage.height).toBe(8);
    expect(isColor({ w: 0, h: 0 }, patches.previewImage, BLUE)).toBe(true);
    expect(isColor({ w: 17, h: 7 }, patches.previewImage, BLUE)).toBe(true);
  });

  it('with the right button only replaces primary-colored pixels with the secondary color', () => {
    const state: TsPaintStoreState = stateWithEraserSize(8);
    setPixel(state.image, { w: 25, h: 50 }, RED); // (25,50) is red (primary)
    setPixel(state.image, { w: 26, h: 50 }, WHITE); // (26,50) is white
    const action: EraserAction = new EraserAction(
      [
        { w: 20, h: 50 },
        { w: 30, h: 50 },
      ],
      true,
      'image'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isColor({ w: 25, h: 50 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 26, h: 50 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 24, h: 50 }, patches.image, BLACK)).toBe(true);
  });

  it('with the right button the preview shows the untouched pixels of the affected area', () => {
    const state: TsPaintStoreState = stateWithEraserSize(8);
    setPixel(state.image, { w: 25, h: 50 }, RED); // (25,50) is red (primary)
    const action: EraserAction = new EraserAction(
      [
        { w: 20, h: 50 },
        { w: 30, h: 50 },
      ],
      true,
      'preview'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.previewOffset).toEqual({ w: 17, h: 47 });
    expect(isColor({ w: 8, h: 3 }, patches.previewImage, BLUE)).toBe(true);
    expect(isColor({ w: 0, h: 0 }, patches.previewImage, BLACK)).toBe(true);
    expect(patches.previewImage.data[3]).toBe(255);
  });

  it('undo restores the whole padded area', () => {
    const state: TsPaintStoreState = stateWithEraserSize(10);
    const action: EraserAction = new EraserAction(
      [
        { w: 20, h: 50 },
        { w: 30, h: 50 },
      ],
      false,
      'image'
    );

    action.getStatePatches(state);

    const pasteAction: any = action.undoActions[0];
    expect(pasteAction['_imagePart'].width).toBe(20);
    expect(pasteAction['_imagePart'].height).toBe(10);
  });
});

import { EraserAction } from './eraser-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { createImage } from '../../../helpers/image.helpers';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { COLOR_WHITE, DEFAULT_DRAWING_TOOL_OPTIONS } from '../../../services/ts-paint/ts-paint.config';
import { getPixel } from '../../../helpers/drawing.helpers';

const BLACK: Color = { r: 0, g: 0, b: 0 };
const RED: Color = { r: 255, g: 0, b: 0 };
const BLUE: Color = { r: 0, g: 0, b: 255 };

function stateWithEraserSize(size: number): TsPaintStoreState {
  const state: TsPaintStoreState = new TsPaintStoreState();
  state.image = createImage(100, 100, BLACK);
  state.primaryColor = RED;
  state.secondaryColor = BLUE;
  state.drawingToolOptions = { ...DEFAULT_DRAWING_TOOL_OPTIONS, [DrawingToolType.eraser]: { size } };
  return state;
}

function isColor(point: Point, image: ImageData, color: Color): boolean {
  const c: Color = getPixel(point, image);
  return c.r === color.r && c.g === color.g && c.b === color.b;
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
    state.image.data.set([255, 0, 0, 255], 4 * (25 + 100 * 50)); // (25,50) is red (primary)
    state.image.data.set([255, 255, 255, 255], 4 * (26 + 100 * 50)); // (26,50) is white
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
    expect(isColor({ w: 26, h: 50 }, patches.image, COLOR_WHITE)).toBe(true);
    expect(isColor({ w: 24, h: 50 }, patches.image, BLACK)).toBe(true);
  });

  it('with the right button the preview shows the untouched pixels of the affected area', () => {
    const state: TsPaintStoreState = stateWithEraserSize(8);
    state.image.data.set([255, 0, 0, 255], 4 * (25 + 100 * 50)); // (25,50) is red (primary)
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

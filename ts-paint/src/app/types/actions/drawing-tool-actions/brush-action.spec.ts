import { BrushAction } from './brush-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { BrushForm, BrushShape } from '../../drawing-tools/brush-shape';
import { createImage } from '../../../helpers/image.helpers';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { COLOR_WHITE, DEFAULT_DRAWING_TOOL_OPTIONS } from '../../../services/ts-paint/ts-paint.config';
import { getPixel } from '../../../helpers/drawing.helpers';

const RED: Color = { r: 255, g: 0, b: 0 };
const BLUE: Color = { r: 0, g: 0, b: 255 };

function stateWithBrush(shape: BrushShape): TsPaintStoreState {
  const state: TsPaintStoreState = new TsPaintStoreState();
  state.image = createImage(100, 100, COLOR_WHITE);
  state.primaryColor = RED;
  state.secondaryColor = BLUE;
  state.drawingToolOptions = { ...DEFAULT_DRAWING_TOOL_OPTIONS, [DrawingToolType.brush]: { shape } };
  return state;
}

function isColor(point: Point, image: ImageData, color: Color): boolean {
  const c: Color = getPixel(point, image);
  return c.r === color.r && c.g === color.g && c.b === color.b;
}

describe('BrushAction', () => {
  it('stamps the medium round brush (2,4,4,2) in the primary color for a click', () => {
    const state: TsPaintStoreState = stateWithBrush({ form: BrushForm.ROUND, size: 4 });
    const action: BrushAction = new BrushAction([{ w: 10, h: 10 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    // origin is 1 px in, so the 4x4 box covers 9..12
    expect(isColor({ w: 9, h: 9 }, patches.image, COLOR_WHITE)).toBeTrue();
    expect(isColor({ w: 10, h: 9 }, patches.image, RED)).toBeTrue();
    expect(isColor({ w: 11, h: 9 }, patches.image, RED)).toBeTrue();
    expect(isColor({ w: 12, h: 9 }, patches.image, COLOR_WHITE)).toBeTrue();
    expect(isColor({ w: 9, h: 10 }, patches.image, RED)).toBeTrue();
    expect(isColor({ w: 12, h: 11 }, patches.image, RED)).toBeTrue();
    expect(isColor({ w: 12, h: 12 }, patches.image, COLOR_WHITE)).toBeTrue();
    expect(isColor({ w: 13, h: 10 }, patches.image, COLOR_WHITE)).toBeTrue();
  });

  it('paints with the secondary color for the right button', () => {
    const state: TsPaintStoreState = stateWithBrush({ form: BrushForm.SQUARE, size: 2 });
    const action: BrushAction = new BrushAction(
      [
        { w: 10, h: 10 },
        { w: 15, h: 10 },
      ],
      true,
      'image'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isColor({ w: 10, h: 10 }, patches.image, BLUE)).toBeTrue();
    expect(isColor({ w: 16, h: 11 }, patches.image, BLUE)).toBeTrue();
    expect(isColor({ w: 9, h: 10 }, patches.image, COLOR_WHITE)).toBeTrue();
  });

  it('pads the preview by 4 px on each side for the 9 px diagonal brush', () => {
    const state: TsPaintStoreState = stateWithBrush({ form: BrushForm.BACKWARD_DIAGONAL, size: 9 });
    const action: BrushAction = new BrushAction(
      [
        { w: 20, h: 50 },
        { w: 30, h: 50 },
      ],
      false,
      'preview'
    );

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.previewOffset).toEqual({ w: 16, h: 46 });
    expect(patches.previewImage.width).toBe(19);
    expect(patches.previewImage.height).toBe(9);
    expect(isColor({ w: 0, h: 0 }, patches.previewImage, RED)).toBeTrue();
    expect(isColor({ w: 18, h: 8 }, patches.previewImage, RED)).toBeTrue();
    expect(patches.previewImage.data[4 * 18 + 3]).toBe(0);
  });

  it('draws the forward diagonal from bottom left to top right', () => {
    const state: TsPaintStoreState = stateWithBrush({ form: BrushForm.FORWARD_DIAGONAL, size: 3 });
    const action: BrushAction = new BrushAction([{ w: 10, h: 10 }], false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isColor({ w: 9, h: 11 }, patches.image, RED)).toBeTrue();
    expect(isColor({ w: 10, h: 10 }, patches.image, RED)).toBeTrue();
    expect(isColor({ w: 11, h: 9 }, patches.image, RED)).toBeTrue();
    expect(isColor({ w: 9, h: 9 }, patches.image, COLOR_WHITE)).toBeTrue();
    expect(isColor({ w: 11, h: 11 }, patches.image, COLOR_WHITE)).toBeTrue();
  });
});

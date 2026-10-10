import { BrushStrokeAction } from './brush-stroke-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { Point } from '../../base/point';
import { Color } from '../../base/color';
import { Brush } from '../../base/brush';
import { createBrushFromMask } from '../../../helpers/brush.helpers';
import { createTestState } from '../../../../testing/state.factory';
import { alphaAt, BLUE, isColor, RED, setPixel, WHITE } from '../../../../testing/image-test.helpers';

const PLUS_MASK: boolean[][] = [
  [false, true, false],
  [true, true, true],
  [false, true, false],
];

/** Strokes with a brush built from the given mask and origin, optionally only over pixels of one color */
class MaskBrushAction extends BrushStrokeAction {
  public receivedColor1: Color;

  constructor(
    points: Point[],
    swapColors: boolean,
    renderIn: 'image' | 'preview',
    private _mask: boolean[][] = PLUS_MASK,
    private _origin: Point = { w: 1, h: 1 },
    private _replaceOnly?: Color
  ) {
    super(points, swapColors, renderIn);
  }

  protected getBrush(color1: Color): Brush {
    this.receivedColor1 = color1;
    return createBrushFromMask(this._mask, this._origin, color1);
  }

  protected getReplaceOnly(): Color | undefined {
    return this._replaceOnly;
  }
}

const STROKE: Point[] = [
  { w: 10, h: 10 },
  { w: 14, h: 10 },
];

function createState(): TsPaintStoreState {
  return createTestState({ primaryColor: RED, secondaryColor: BLUE });
}

describe('BrushStrokeAction', () => {
  it('stamps the brush at every pixel along the mouse path', () => {
    const action: MaskBrushAction = new MaskBrushAction(STROKE, false, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    for (let w = 9; w <= 15; w++) {
      expect(isColor({ w, h: 10 }, patches.image, RED), `(${w},10)`).toBe(true);
    }
    for (let w = 10; w <= 14; w++) {
      expect(isColor({ w, h: 9 }, patches.image, RED), `(${w},9)`).toBe(true);
      expect(isColor({ w, h: 11 }, patches.image, RED), `(${w},11)`).toBe(true);
    }
    expect(isColor({ w: 9, h: 9 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 15, h: 11 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 8, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 12, h: 8 }, patches.image, WHITE)).toBe(true);
  });

  it('builds the brush from color1, which is the secondary color for the right button', () => {
    const action: MaskBrushAction = new MaskBrushAction(STROKE, true, 'image');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(action.receivedColor1).toEqual(BLUE);
    expect(isColor({ w: 12, h: 10 }, patches.image, BLUE)).toBe(true);
  });

  it('pads the preview by how far the brush reaches before and after its origin', () => {
    const action: MaskBrushAction = new MaskBrushAction(STROKE, false, 'preview');

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(patches.previewOffset).toEqual({ w: 9, h: 9 });
    expect(patches.previewImage.width).toBe(7);
    expect(patches.previewImage.height).toBe(3);
    expect(isColor({ w: 0, h: 1 }, patches.previewImage, RED)).toBe(true);
    expect(isColor({ w: 6, h: 1 }, patches.previewImage, RED)).toBe(true);
    expect(alphaAt({ w: 0, h: 0 }, patches.previewImage)).toBe(0);
  });

  it('pads asymmetrically for a brush whose origin is not centred', () => {
    const twoByTwo: boolean[][] = [
      [true, true],
      [true, true],
    ];
    const action: MaskBrushAction = new MaskBrushAction(STROKE, false, 'preview', twoByTwo, { w: 0, h: 0 });

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(createState());

    expect(patches.previewOffset).toEqual({ w: 10, h: 10 });
    expect(patches.previewImage.width).toBe(6);
    expect(patches.previewImage.height).toBe(2);
    expect(isColor({ w: 5, h: 1 }, patches.previewImage, RED)).toBe(true);
  });

  it('only paints over pixels of the replaceOnly color when one is given', () => {
    const state: TsPaintStoreState = createState();
    setPixel(state.image, { w: 12, h: 10 }, BLUE);
    setPixel(state.image, { w: 13, h: 9 }, BLUE);
    const action: MaskBrushAction = new MaskBrushAction(STROKE, false, 'image', PLUS_MASK, { w: 1, h: 1 }, BLUE);

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(isColor({ w: 12, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 13, h: 9 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 11, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 12, h: 11 }, patches.image, WHITE)).toBe(true);
  });

  it('undo covers the padded area', () => {
    const action: MaskBrushAction = new MaskBrushAction(STROKE, false, 'image');

    action.getStatePatches(createState());

    expect(action.undoActions[0]['_imagePart'].width).toBe(7);
    expect(action.undoActions[0]['_imagePart'].height).toBe(3);
    expect(action.undoActions[1]['_newLocation']).toEqual({ w: 9, h: 9 });
  });
});

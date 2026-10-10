import { RectangleAction } from './rectangle-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { FillType } from '../../drawing-tools/fill-type';
import { Point } from '../../base/point';
import { DEFAULT_DRAWING_TOOL_OPTIONS } from '../../../services/ts-paint/ts-paint.config';
import { createTestState } from '../../../../testing/state.factory';
import { BLUE, isColor, RED, WHITE } from '../../../../testing/image-test.helpers';

const BOX: Point[] = [
  { w: 10, h: 10 },
  { w: 20, h: 15 },
];

function stateWith(fillType: FillType, thickness: number = 1): TsPaintStoreState {
  return createTestState({
    primaryColor: RED,
    secondaryColor: BLUE,
    drawingToolOptions: {
      ...DEFAULT_DRAWING_TOOL_OPTIONS,
      [DrawingToolType.rectangle]: { fillType },
      [DrawingToolType.line]: { thickness },
    },
  });
}

describe('RectangleAction', () => {
  it('draws only the 1 px border when the fill type is EMPTY', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleAction(BOX, false, 'image').getStatePatches(
      stateWith(FillType.EMPTY)
    );

    expect(isColor({ w: 10, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 20, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 15, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 10, h: 12 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 15, h: 12 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 11, h: 11 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 9, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 21, h: 15 }, patches.image, WHITE)).toBe(true);
  });

  it('fills the inside with the secondary color under a primary border for FILL_SECONDARY', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleAction(BOX, false, 'image').getStatePatches(
      stateWith(FillType.FILL_SECONDARY)
    );

    expect(isColor({ w: 10, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 15, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 11, h: 11 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 19, h: 14 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 21, h: 16 }, patches.image, WHITE)).toBe(true);
  });

  it('fills everything with the primary color for FILL_PRIMARY', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleAction(BOX, false, 'image').getStatePatches(
      stateWith(FillType.FILL_PRIMARY)
    );

    expect(isColor({ w: 10, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 15, h: 12 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 20, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 21, h: 15 }, patches.image, WHITE)).toBe(true);
  });

  it('uses the line thickness for the border', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleAction(BOX, false, 'image').getStatePatches(
      stateWith(FillType.FILL_SECONDARY, 2)
    );

    expect(isColor({ w: 11, h: 11 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 12, h: 12 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 19, h: 14 }, patches.image, RED)).toBe(true);
  });

  it('swaps border and fill colors for the right button', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleAction(BOX, true, 'image').getStatePatches(
      stateWith(FillType.FILL_SECONDARY)
    );

    expect(isColor({ w: 10, h: 10 }, patches.image, BLUE)).toBe(true);
    expect(isColor({ w: 15, h: 12 }, patches.image, RED)).toBe(true);
  });

  it('draws the same rectangle when dragged from bottom right to top left', () => {
    const patches: Partial<TsPaintStoreState> = new RectangleAction([BOX[1], BOX[0]], false, 'image').getStatePatches(
      stateWith(FillType.EMPTY)
    );

    expect(isColor({ w: 10, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 20, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 15, h: 12 }, patches.image, WHITE)).toBe(true);
    expect(patches.previewImage.width).toBe(1);
  });
});

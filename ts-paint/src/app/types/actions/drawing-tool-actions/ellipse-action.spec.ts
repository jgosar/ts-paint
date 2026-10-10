import { EllipseAction } from './ellipse-action';
import { TsPaintStoreState } from '../../../services/ts-paint/ts-paint.store.state';
import { DrawingToolType } from '../../drawing-tools/drawing-tool-type';
import { FillType } from '../../drawing-tools/fill-type';
import { Point } from '../../base/point';
import { DEFAULT_DRAWING_TOOL_OPTIONS } from '../../../services/ts-paint/ts-paint.config';
import { createTestState } from '../../../../testing/state.factory';
import { alphaAt, BLUE, isColor, RED, WHITE } from '../../../../testing/image-test.helpers';

const BOX: Point[] = [
  { w: 10, h: 10 },
  { w: 20, h: 20 },
];

function stateWith(thickness: number, fillType: FillType = FillType.EMPTY): TsPaintStoreState {
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

describe('EllipseAction', () => {
  it('draws a 1 px outline touching the four sides of the box', () => {
    const patches: Partial<TsPaintStoreState> = new EllipseAction(BOX, false, 'image').getStatePatches(stateWith(1));

    expect(isColor({ w: 10, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 20, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 15, h: 10 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 15, h: 20 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 11, h: 15 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 15, h: 15 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 10, h: 10 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 9, h: 15 }, patches.image, WHITE)).toBe(true);
  });

  it('ignores the rectangle fill type', () => {
    const patches: Partial<TsPaintStoreState> = new EllipseAction(BOX, false, 'image').getStatePatches(
      stateWith(1, FillType.FILL_PRIMARY)
    );

    expect(isColor({ w: 15, h: 15 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 10, h: 15 }, patches.image, RED)).toBe(true);
  });

  it('thickens the outline inwards by the line thickness', () => {
    const patches: Partial<TsPaintStoreState> = new EllipseAction(BOX, false, 'image').getStatePatches(stateWith(3));

    expect(isColor({ w: 10, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 12, h: 15 }, patches.image, RED)).toBe(true);
    expect(isColor({ w: 13, h: 15 }, patches.image, WHITE)).toBe(true);
    expect(isColor({ w: 9, h: 15 }, patches.image, WHITE)).toBe(true);
  });

  it('draws with the secondary color for the right button', () => {
    const patches: Partial<TsPaintStoreState> = new EllipseAction(BOX, true, 'image').getStatePatches(stateWith(1));

    expect(isColor({ w: 10, h: 15 }, patches.image, BLUE)).toBe(true);
  });

  it('previews inside the dragged box', () => {
    const patches: Partial<TsPaintStoreState> = new EllipseAction(BOX, false, 'preview').getStatePatches(stateWith(1));

    expect(patches.previewOffset).toEqual({ w: 10, h: 10 });
    expect(patches.previewImage.width).toBe(11);
    expect(patches.previewImage.height).toBe(11);
    expect(isColor({ w: 0, h: 5 }, patches.previewImage, RED)).toBe(true);
    expect(alphaAt({ w: 5, h: 5 }, patches.previewImage)).toBe(0);
  });
});

import { SetDrawingToolOptionsAction } from './set-drawing-tool-options-action';
import { DrawingToolType } from '../drawing-tools/drawing-tool-type';
import { FillType } from '../drawing-tools/fill-type';
import { BrushForm } from '../drawing-tools/brush-shape';
import { DrawingToolOptions } from '../drawing-tools/drawing-tool-options';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { classesOf, executeAndUndo } from '../../../testing/action-test.helpers';

const OPTIONS: DrawingToolOptions = {
  [DrawingToolType.rectangle]: { fillType: FillType.FILL_PRIMARY },
  [DrawingToolType.line]: { thickness: 3 },
  [DrawingToolType.eraser]: { size: 6 },
  [DrawingToolType.brush]: { shape: { form: BrushForm.SQUARE, size: 5 } },
};

describe('SetDrawingToolOptionsAction', () => {
  it('merges the changed options over the current ones', () => {
    const state: TsPaintStoreState = createTestState({ drawingToolOptions: OPTIONS });

    const patches: Partial<TsPaintStoreState> = new SetDrawingToolOptionsAction({
      [DrawingToolType.line]: { thickness: 7 },
    }).getStatePatches(state);

    expect(patches.drawingToolOptions).toEqual({ ...OPTIONS, [DrawingToolType.line]: { thickness: 7 } });
    expect(state.drawingToolOptions).toEqual(OPTIONS);
    expect(patches.image).toBeUndefined();
  });

  it('replaces a whole tool entry rather than deep merging it', () => {
    const state: TsPaintStoreState = createTestState({ drawingToolOptions: OPTIONS });

    const patches: Partial<TsPaintStoreState> = new SetDrawingToolOptionsAction({
      [DrawingToolType.brush]: { shape: { form: BrushForm.ROUND, size: 7 } },
    }).getStatePatches(state);

    expect(patches.drawingToolOptions[DrawingToolType.brush]).toEqual({ shape: { form: BrushForm.ROUND, size: 7 } });
  });

  it('undoes by restoring all the previous options', () => {
    const state: TsPaintStoreState = createTestState({ drawingToolOptions: OPTIONS });
    const action: SetDrawingToolOptionsAction = new SetDrawingToolOptionsAction({
      [DrawingToolType.line]: { thickness: 7 },
      [DrawingToolType.eraser]: { size: 10 },
    });

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([SetDrawingToolOptionsAction]);
    expect(restored.drawingToolOptions).toEqual(OPTIONS);
  });
});

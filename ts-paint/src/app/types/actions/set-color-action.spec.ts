import { SetColorAction } from './set-color-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { BLUE, GREEN, RED } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo } from '../../../testing/action-test.helpers';

describe('SetColorAction', () => {
  it('sets the primary color', () => {
    const state: TsPaintStoreState = createTestState();

    const patches: Partial<TsPaintStoreState> = new SetColorAction({ color: RED, primary: true }).getStatePatches(
      state
    );

    expect(patches.primaryColor).toEqual(RED);
    expect('secondaryColor' in patches).toBe(false);
    expect(patches.image).toBeUndefined();
  });

  it('sets the secondary color', () => {
    const state: TsPaintStoreState = createTestState();

    const patches: Partial<TsPaintStoreState> = new SetColorAction({ color: RED, primary: false }).getStatePatches(
      state
    );

    expect(patches.secondaryColor).toEqual(RED);
    expect('primaryColor' in patches).toBe(false);
  });

  it('undoes by restoring the previous color of the same slot', () => {
    const state: TsPaintStoreState = createTestState({ primaryColor: GREEN, secondaryColor: BLUE });
    const action: SetColorAction = new SetColorAction({ color: RED, primary: false });

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([SetColorAction]);
    expect(restored.secondaryColor).toEqual(BLUE);
    expect(restored.primaryColor).toEqual(GREEN);
  });
});

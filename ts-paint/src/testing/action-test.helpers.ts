import { TsPaintStoreState } from '../app/services/ts-paint/ts-paint.store.state';
import { TsPaintAction } from '../app/types/actions/ts-paint-action';

/** The state after the patches have been applied, the way the store merges them */
export function applyPatches(state: TsPaintStoreState, patches: Partial<TsPaintStoreState>): TsPaintStoreState {
  return { ...state, ...patches };
}

/** Runs the actions one after another without logging them to history, the way the store undoes an action */
export function applyActions(state: TsPaintStoreState, actions: TsPaintAction[]): TsPaintStoreState {
  return actions.reduce((current, action) => applyPatches(current, action.getStatePatches(current, false)), state);
}

/** Executes the action (logging it to history) and returns the resulting state */
export function execute(action: TsPaintAction, state: TsPaintStoreState): TsPaintStoreState {
  return applyPatches(state, action.getStatePatches(state));
}

/** Executes the action and then its undo actions, returning the state after the undo */
export function executeAndUndo(action: TsPaintAction, state: TsPaintStoreState): TsPaintStoreState {
  return applyActions(execute(action, state), action.undoActions);
}

/** True when both images have the same size and identical RGBA data */
export function imagesEqual(a: ImageData, b: ImageData): boolean {
  return a.width === b.width && a.height === b.height && a.data.every((value, index) => value === b.data[index]);
}

/** The constructors of the given actions, for asserting on an undo chain */
export function classesOf(actions: TsPaintAction[]): Function[] {
  return actions.map((action) => action.constructor);
}

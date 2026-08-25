import { BehaviorSubject, Observable } from 'rxjs';

export abstract class Store<S> {
  private readonly _stateSubject: BehaviorSubject<S>;
  readonly state$: Observable<S>;

  protected constructor(initialState: S) {
    this._stateSubject = new BehaviorSubject(initialState);
    this.state$ = this._stateSubject.asObservable();
  }

  get state(): S {
    return this._stateSubject.getValue();
  }

  setState(nextState: S): void {
    this._stateSubject.next(nextState);
  }

  patchState(value: any, ...path: Array<string | number>): void {
    if (path.length < 1) {
      return;
    }
    this.setState(this.getUpdatedState(value, this.state, path));
  }

  private getUpdatedState(value: any, stateSubtree: any, path: Array<string | number>): any {
    const key = path[0];
    if (path.length === 1) {
      return { ...stateSubtree, [key]: value };
    }
    if (stateSubtree[key] === undefined || stateSubtree[key] === null) {
      return { ...stateSubtree, [key]: this.createStateSubtree(value, path.slice(1)) };
    }
    return { ...stateSubtree, [key]: this.getUpdatedState(value, stateSubtree[key], path.slice(1)) };
  }

  private createStateSubtree(value: any, path: Array<string | number>): any {
    const key = path[0];
    if (path.length === 1) {
      return { [key]: value };
    }
    return { [key]: this.createStateSubtree(value, path.slice(1)) };
  }
}

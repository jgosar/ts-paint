import { TsPaintStoreState } from './ts-paint.store.state';
import { Object } from 'ts-toolbelt';

export interface TsPaintStatePatch<P1 extends keyof Object.Path<TsPaintStoreState, []>> {
  value: Object.Path<TsPaintStoreState, [P1]>,
  property: P1
}
import { fakeAsync } from '@angular/core/testing';

declare const Zone: any;

/**
 * zone-testing patches jasmine/jest/mocha so that every hook and test body runs inside a ProxyZone, which Angular's
 * fakeAsync() relies on. Vitest is not patched, so fakeAsync() throws "Expected to be running in 'ProxyZone'".
 *
 * `withProxyZone` runs a hook or test body in zone.js's shared root ProxyZone (its own experimental helper). Use it
 * on the `beforeEach` that creates the fixture as well: NgZone forks from the zone that is current when TestBed
 * creates it, so a fixture created outside the ProxyZone schedules its timers (event handlers, lifecycle hooks) past
 * fakeAsync's reach, and tick()/flush() never fire them.
 */
export function withProxyZone<T extends (...args: any[]) => any>(fn: T): T {
  return Zone[Zone.__symbol__('fakeAsyncTest')].withProxyZone(fn);
}

/** fakeAsync() for Vitest: `it('...', fakeAsyncTest(() => { ... tick(100); ... }))` */
export function fakeAsyncTest(testBody: () => void): () => void {
  return withProxyZone(fakeAsync(testBody));
}

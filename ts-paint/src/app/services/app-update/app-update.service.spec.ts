import { Mock, vi } from 'vitest';
import { ApplicationRef } from '@angular/core';
import { SwUpdate, UnrecoverableStateEvent } from '@angular/service-worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { AppUpdateService } from './app-update.service';

const ONE_HOUR_MS: number = 60 * 60 * 1000;

interface ServiceHarness {
  service: AppUpdateService;
  unrecoverable: Subject<UnrecoverableStateEvent>;
  isStable: BehaviorSubject<boolean>;
  checkForUpdate: Mock<() => Promise<boolean>>;
}

function createService(isEnabled: boolean): ServiceHarness {
  const unrecoverable: Subject<UnrecoverableStateEvent> = new Subject<UnrecoverableStateEvent>();
  const isStable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  const checkForUpdate: Mock<() => Promise<boolean>> = vi.fn(() => Promise.resolve(true));
  const swUpdate: Partial<SwUpdate> = { isEnabled, unrecoverable, checkForUpdate };
  const appRef: Partial<ApplicationRef> = { isStable };
  const service: AppUpdateService = new AppUpdateService(swUpdate as SwUpdate, appRef as ApplicationRef);

  return { service, unrecoverable, isStable, checkForUpdate };
}

describe('AppUpdateService', () => {
  // Angular's fakeAsync needs a ProxyZone, which the Vitest runner does not provide, so the hourly timer is
  // driven with Vitest's fake timers instead.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('start with service workers disabled', () => {
    it('does not listen for unrecoverable states', () => {
      const { service, unrecoverable } = createService(false);
      service.start();
      expect(unrecoverable.observers.length).toBe(0);
    });

    it('never checks for updates', () => {
      const { service, isStable, checkForUpdate } = createService(false);
      service.start();
      isStable.next(true);
      vi.advanceTimersByTime(3 * ONE_HOUR_MS);
      expect(checkForUpdate).not.toHaveBeenCalled();
    });

    it('does not watch the application stability', () => {
      const { service, isStable } = createService(false);
      service.start();
      expect(isStable.observers.length).toBe(0);
    });
  });

  describe('start with service workers enabled', () => {
    // The reload itself cannot be asserted: location.reload is unforgeable and module mocking is not available
    // under the Angular test builder, and really emitting on `unrecoverable` would reload the test page.
    it('subscribes to unrecoverable states so that a broken cache triggers a reload', () => {
      const { service, unrecoverable } = createService(true);
      service.start();
      expect(unrecoverable.observers.length).toBe(1);
    });

    it('does not check for updates before the application is stable', () => {
      const { service, checkForUpdate } = createService(true);
      service.start();
      vi.advanceTimersByTime(3 * ONE_HOUR_MS);
      expect(checkForUpdate).not.toHaveBeenCalled();
    });

    it('checks for an update every hour once the application is stable', () => {
      const { service, isStable, checkForUpdate } = createService(true);
      service.start();
      isStable.next(true);

      vi.advanceTimersByTime(ONE_HOUR_MS - 1);
      expect(checkForUpdate, 'not before the first hour is over').not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(checkForUpdate).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(2 * ONE_HOUR_MS);
      expect(checkForUpdate).toHaveBeenCalledTimes(3);
    });

    it('starts the hourly timer only once, on the first stable emission', () => {
      const { service, isStable, checkForUpdate } = createService(true);
      service.start();
      isStable.next(true);
      isStable.next(false);
      isStable.next(true);

      vi.advanceTimersByTime(ONE_HOUR_MS);
      expect(checkForUpdate).toHaveBeenCalledTimes(1);
      expect(isStable.observers.length, 'the stability subscription completed after the first true').toBe(0);
    });

    it('ignores a failed update check and keeps checking', async () => {
      const { service, isStable, checkForUpdate } = createService(true);
      checkForUpdate.mockImplementation(() => Promise.reject(new Error('offline')));
      service.start();
      isStable.next(true);

      await vi.advanceTimersByTimeAsync(ONE_HOUR_MS);
      await vi.advanceTimersByTimeAsync(ONE_HOUR_MS);
      expect(checkForUpdate).toHaveBeenCalledTimes(2);
    });
  });
});

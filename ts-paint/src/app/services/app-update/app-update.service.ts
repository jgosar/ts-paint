import { ApplicationRef, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { interval } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { reloadPage } from '../../helpers/environment.helpers';

const UPDATE_CHECK_INTERVAL_MS: number = 60 * 60 * 1000;

/**
 * Keeps the installed app up to date. New versions are applied silently on the next launch (the service worker's
 * default behaviour); this service only makes sure long-running windows keep checking for them and that a broken
 * cache recovers by reloading.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  constructor(private _swUpdate: SwUpdate, private _appRef: ApplicationRef) {}

  start(): void {
    if (!this._swUpdate.isEnabled) {
      return;
    }

    this._swUpdate.unrecoverable.subscribe(() => reloadPage());

    // The timer is created only once the app is stable, otherwise it would postpone service worker registration
    this._appRef.isStable
      .pipe(
        first((stable) => stable),
        switchMap(() => interval(UPDATE_CHECK_INTERVAL_MS))
      )
      .subscribe(() => this._swUpdate.checkForUpdate().catch(() => undefined));
  }
}

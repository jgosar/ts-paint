import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Renders the UI with a whole number of device pixels per CSS pixel, regardless of the OS display scaling. Integer
 * scaling (100%, 200%, 300%) is left untouched, while fractional scaling (e.g. 125% or 150% on Windows) is snapped
 * to the nearest integer so that the 1px Windows 95 bevels, the bitmap font and the image canvas stay crisp.
 *
 * Note that devicePixelRatio also includes browser zoom (Ctrl +/-), so that is snapped to integer steps as well.
 */
@Injectable({ providedIn: 'root' })
export class PixelScalingService {
  private _document: Document = inject(DOCUMENT);

  start(): void {
    this.apply();
  }

  private apply(): void {
    const window: Window | null = this._document.defaultView;
    if (!window) {
      return;
    }

    const devicePixelRatio: number = window.devicePixelRatio || 1;
    const devicePixelsPerCssPixel: number = Math.max(1, Math.round(devicePixelRatio));
    this._document.body.style.zoom = String(devicePixelsPerCssPixel / devicePixelRatio);
    // Changing the zoom changes the layout size without firing a resize event
    window.dispatchEvent(new Event('resize'));

    // Re-apply when the ratio changes, e.g. when the window is moved to a monitor with a different scaling
    window
      .matchMedia(`(resolution: ${devicePixelRatio}dppx)`)
      .addEventListener('change', () => this.apply(), { once: true });
  }
}

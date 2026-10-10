import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/core';
import { PixelScalingService } from './pixel-scaling.service';
import {
  FakeDocument,
  FakeWindow,
  createFakeDocument,
  createFakeDocumentWithoutWindow,
} from 'src/testing/fake-document';

function startService(fakeDocument: FakeDocument): PixelScalingService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: fakeDocument.asDocument() }] });
  const service: PixelScalingService = TestBed.inject(PixelScalingService);
  service.start();
  return service;
}

function zoomAppliedFor(devicePixelRatio: number): number {
  const fakeDocument: FakeDocument = createFakeDocument(devicePixelRatio);
  startService(fakeDocument);
  return Number(fakeDocument.body.style.zoom);
}

describe('PixelScalingService', () => {
  describe('start', () => {
    it('leaves integer device pixel ratios alone (zoom 1)', () => {
      expect(zoomAppliedFor(1)).toBe(1);
      expect(zoomAppliedFor(2)).toBe(1);
      expect(zoomAppliedFor(3)).toBe(1);
    });

    it('zooms fractional ratios to the nearest whole number of device pixels per CSS pixel', () => {
      expect(zoomAppliedFor(1.5)).toBeCloseTo(2 / 1.5, 10);
      expect(zoomAppliedFor(2.5)).toBeCloseTo(3 / 2.5, 10);
      expect(zoomAppliedFor(1.25)).toBeCloseTo(1 / 1.25, 10);
    });

    it('never goes below one device pixel per CSS pixel', () => {
      expect(zoomAppliedFor(0.4)).toBeCloseTo(1 / 0.4, 10);
    });

    it('treats a missing device pixel ratio as 1', () => {
      expect(zoomAppliedFor(0)).toBe(1);
      expect(zoomAppliedFor(undefined)).toBe(1);
    });

    it('writes the zoom as a CSS value string', () => {
      const fakeDocument: FakeDocument = createFakeDocument(2.5);
      startService(fakeDocument);
      expect(fakeDocument.body.style.zoom).toBe('1.2');
    });

    it('dispatches a resize event so that layout-dependent code picks up the new size', () => {
      const fakeDocument: FakeDocument = createFakeDocument(1.5);
      startService(fakeDocument);
      const window: FakeWindow = fakeDocument.defaultView;
      expect(window.dispatchedEvents.length).toBe(1);
      expect(window.dispatchedEvents[0].type).toBe('resize');
    });

    it('listens once for the current ratio to stop matching', () => {
      const fakeDocument: FakeDocument = createFakeDocument(1.5);
      startService(fakeDocument);
      const window: FakeWindow = fakeDocument.defaultView;
      expect(window.mediaQueries.length).toBe(1);
      expect(window.mediaQueries[0].media).toBe('(resolution: 1.5dppx)');
      expect(window.mediaQueries[0].listenerCount).toBe(1);
    });

    it('re-applies the zoom with the new ratio when the media query changes, and listens for the next change', () => {
      const fakeDocument: FakeDocument = createFakeDocument(1.5);
      startService(fakeDocument);
      const window: FakeWindow = fakeDocument.defaultView;

      window.devicePixelRatio = 2;
      window.lastMediaQuery.fireChange();

      expect(fakeDocument.body.style.zoom).toBe('1');
      expect(window.dispatchedEvents.length).toBe(2);
      expect(window.mediaQueries.length).toBe(2);
      expect(window.mediaQueries[1].media).toBe('(resolution: 2dppx)');
      expect(window.mediaQueries[0].listenerCount, 'the previous listener was registered with once').toBe(0);

      window.devicePixelRatio = 1.25;
      window.lastMediaQuery.fireChange();
      expect(Number(fakeDocument.body.style.zoom)).toBeCloseTo(1 / 1.25, 10);
      expect(window.dispatchedEvents.length).toBe(3);
    });

    it('does nothing when the document has no window', () => {
      const fakeDocument: FakeDocument = createFakeDocumentWithoutWindow();
      expect(() => startService(fakeDocument)).not.toThrow();
      expect(fakeDocument.body.style.zoom).toBeUndefined();
    });
  });
});

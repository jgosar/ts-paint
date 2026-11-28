/**
 * PixelScalingService zooms the page (document.body.style.zoom) on screens with a fractional device pixel ratio, and
 * a spec that boots the whole app leaves that zoom on the page for the specs after it. Specs that check exact css
 * pixel sizes or distances use this to run without a page zoom (or with a chosen one) and put it back afterwards.
 */
export function usePageZoom(zoom: string = ''): { set(zoom: string): void } {
  let original: string;
  beforeEach(() => {
    original = document.body.style.zoom;
    document.body.style.zoom = zoom;
  });
  afterEach(() => {
    document.body.style.zoom = original;
  });
  return {
    set(newZoom: string) {
      document.body.style.zoom = newZoom;
    },
  };
}

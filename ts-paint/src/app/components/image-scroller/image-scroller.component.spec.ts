import { ComponentFixture, flush, TestBed, tick } from '@angular/core/testing';
import { fakeAsyncTest, withProxyZone } from '../../../testing/proxy-zone.helpers';
import { ImageScrollerComponent } from './image-scroller.component';
import { Point } from '../../types/base/point';

describe('ImageScrollerComponent', () => {
  let fixture: ComponentFixture<ImageScrollerComponent>;
  let component: ImageScrollerComponent;
  let host: HTMLElement;
  let scrollPositions: Point[];
  let viewportSizes: Point[];

  // The fixture must be created in the ProxyZone so that fakeAsync controls the component's timers (see the helper)
  beforeEach(
    withProxyZone(async () => {
      await TestBed.configureTestingModule({ declarations: [ImageScrollerComponent] }).compileComponents();
      fixture = TestBed.createComponent(ImageScrollerComponent);
      component = fixture.componentInstance;
      host = fixture.nativeElement;
      // A 100x100 scrollable viewport around a much bigger child, like the image padding in the app. TestBed hosts the
      // component on a <div>, so the :host(tsp-image-scroller) overflow rule does not apply and is set here instead.
      host.style.display = 'block';
      host.style.overflow = 'auto';
      host.style.width = '100px';
      host.style.height = '100px';
      const content: HTMLDivElement = document.createElement('div');
      content.style.width = '1000px';
      content.style.height = '1000px';
      host.appendChild(content);
      scrollPositions = [];
      viewportSizes = [];
      component.scrollPositionChange.subscribe((p) => scrollPositions.push(p));
      component.viewportSizeChange.subscribe((s) => viewportSizes.push(s));
    })
  );

  /** Scrolls the host and dispatches the scroll event the browser would fire asynchronously */
  function scrollTo(w: number, h: number) {
    host.scrollLeft = w;
    host.scrollTop = h;
    host.dispatchEvent(new Event('scroll'));
  }

  it(
    'reports the initial viewport size after a timeout, debounced by 400ms',
    fakeAsyncTest(() => {
      fixture.detectChanges();
      expect(viewportSizes).toEqual([]);

      tick(0);
      expect(viewportSizes, 'still waiting for the debounce').toEqual([]);
      tick(399);
      expect(viewportSizes).toEqual([]);
      tick(1);
      expect(viewportSizes).toEqual([{ w: host.clientWidth, h: host.clientHeight }]);
      expect(host.clientWidth).toBeGreaterThan(0);
      expect(host.clientWidth).toBeLessThanOrEqual(100);
    })
  );

  it(
    'debounces scroll events by 400ms and emits only the last position',
    fakeAsyncTest(() => {
      fixture.detectChanges();
      flush();

      scrollTo(10, 20);
      tick(300);
      scrollTo(30, 40);
      tick(399);
      expect(scrollPositions).toEqual([]);
      tick(1);
      expect(scrollPositions).toEqual([{ w: 30, h: 40 }]);

      scrollTo(5, 6);
      tick(400);
      expect(scrollPositions).toEqual([
        { w: 30, h: 40 },
        { w: 5, h: 6 },
      ]);
    })
  );

  it(
    'debounces window resize events into viewportSizeChange',
    fakeAsyncTest(() => {
      fixture.detectChanges();
      flush();
      viewportSizes.length = 0;

      host.style.width = '60px';
      host.style.height = '70px';
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
      tick(399);
      expect(viewportSizes).toEqual([]);
      tick(1);
      expect(viewportSizes.length).toBe(1);
      expect(viewportSizes[0].w).toBeLessThanOrEqual(60);
      expect(viewportSizes[0].w).toBeGreaterThan(40);
      expect(viewportSizes[0].h).toBeLessThanOrEqual(70);
      expect(viewportSizes[0].h).toBeGreaterThan(50);
    })
  );

  it(
    'applies the scrollPosition input to the element in a timeout',
    fakeAsyncTest(() => {
      fixture.detectChanges();
      flush();

      fixture.componentRef.setInput('scrollPosition', { w: 25, h: 35 });
      fixture.detectChanges();
      expect(host.scrollLeft, 'not applied synchronously').toBe(0);
      tick(0);
      expect(host.scrollLeft).toBe(25);
      expect(host.scrollTop).toBe(35);
    })
  );

  it(
    'ignores the one scroll event caused by applying the scrollPosition input, but not the next',
    fakeAsyncTest(() => {
      fixture.detectChanges();
      flush();

      fixture.componentRef.setInput('scrollPosition', { w: 25, h: 35 });
      fixture.detectChanges();
      tick(0);
      host.dispatchEvent(new Event('scroll')); // the browser's reaction to the programmatic scroll
      tick(400);
      expect(scrollPositions).toEqual([]);

      scrollTo(50, 60);
      tick(400);
      expect(scrollPositions).toEqual([{ w: 50, h: 60 }]);
    })
  );

  it(
    'emits nothing after it is destroyed',
    fakeAsyncTest(() => {
      fixture.detectChanges();
      flush();
      viewportSizes.length = 0;

      scrollTo(10, 10);
      fixture.destroy();
      tick(400);
      host.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      tick(400);

      expect(scrollPositions).toEqual([]);
      expect(viewportSizes).toEqual([]);
    })
  );
});

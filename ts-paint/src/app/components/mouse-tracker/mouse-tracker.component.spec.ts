import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MouseTrackerComponent } from './mouse-tracker.component';
import { createImage } from '../../helpers/image.helpers';
import { WHITE } from '../../../testing/image-test.helpers';
import { TspMouseEvent } from '../../types/mouse-tracker/tsp-mouse-event';
import { MouseButton } from '../../types/mouse-tracker/mouse-button';

describe('MouseTrackerComponent', () => {
  let fixture: ComponentFixture<MouseTrackerComponent>;
  let component: MouseTrackerComponent;
  let moves: TspMouseEvent[];
  let downs: TspMouseEvent[];
  let ups: TspMouseEvent[];
  let scrolls: TspMouseEvent[];
  // 10x10 image at zoom 2 => tracker is 20x20 css px; the browser applies a css zoom of 1.5 so it measures 30x30
  const RECT_LEFT: number = 100;
  const RECT_TOP: number = 50;
  const CSS_ZOOM: number = 1.5;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [MouseTrackerComponent] }).compileComponents();
    fixture = TestBed.createComponent(MouseTrackerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('image', createImage(10, 10, WHITE));
    fixture.componentRef.setInput('zoom', 2);
    fixture.detectChanges();
    moves = [];
    downs = [];
    ups = [];
    scrolls = [];
    component.mouseMove.subscribe((e) => moves.push(e));
    component.mouseDown.subscribe((e) => downs.push(e));
    component.mouseUp.subscribe((e) => ups.push(e));
    component.mouseScroll.subscribe((e) => scrolls.push(e));
    stubRect(20 * CSS_ZOOM, 20 * CSS_ZOOM);
  });

  function tracker(): HTMLDivElement {
    return fixture.nativeElement.querySelector('.tsp-mouse-tracker__div');
  }

  function stubRect(width: number, height: number) {
    vi.spyOn(tracker(), 'getBoundingClientRect').mockReturnValue({
      left: RECT_LEFT,
      top: RECT_TOP,
      x: RECT_LEFT,
      y: RECT_TOP,
      width,
      height,
      right: RECT_LEFT + width,
      bottom: RECT_TOP + height,
      toJSON: () => ({}),
    });
  }

  /** Dispatches a mouse event at the given position in zoomed css px relative to the tracker (before the css zoom) */
  function fire(type: string, w: number, h: number, init: MouseEventInit = {}): MouseEvent {
    const event: MouseEvent = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: RECT_LEFT + w * CSS_ZOOM,
      clientY: RECT_TOP + h * CSS_ZOOM,
      ...init,
    });
    tracker().dispatchEvent(event);
    return event;
  }

  it('sizes the tracker div to the zoomed image', () => {
    expect(tracker().style.width).toBe('20px');
    expect(tracker().style.height).toBe('20px');

    fixture.componentRef.setInput('zoom', 4);
    fixture.detectChanges();
    expect(tracker().style.width).toBe('40px');
    expect(tracker().style.height).toBe('40px');
  });

  it('uses a 1x1 size when there is no image', () => {
    fixture.componentRef.setInput('image', undefined);
    fixture.componentRef.setInput('zoom', 3);
    fixture.detectChanges();
    expect(tracker().style.width).toBe('3px');
    expect(tracker().style.height).toBe('3px');
  });

  it('converts client coordinates through the css zoom ratio and un-zooms them into image pixels', () => {
    fire('mousemove', 10, 5);
    expect(moves).toEqual([{ point: { w: 5, h: 2 }, outsideCanvas: false, shiftKey: false }]);
  });

  it('floors to the pixel containing the zoomed position', () => {
    fire('mousemove', 7, 3);
    expect(moves[0].point).toEqual({ w: 3, h: 1 });
  });

  it('assumes no css zoom when the tracker has no measured width', () => {
    stubRect(0, 0);
    fire('mousemove', 10 / CSS_ZOOM, 6 / CSS_ZOOM);
    expect(moves[0].point).toEqual({ w: 5, h: 3 });
  });

  it('clamps positions outside the image to its edge pixels', () => {
    fire('mousemove', 100, -40);
    fire('mousemove', -5, 300);
    expect(moves.map((m) => m.point)).toEqual([
      { w: 9, h: 0 },
      { w: 0, h: 9 },
    ]);
  });

  it('reports the shift key on moves, downs and ups', () => {
    fire('mousemove', 0, 0, { shiftKey: true });
    fire('mousedown', 0, 0, { shiftKey: true });
    fire('mouseup', 0, 0, { shiftKey: true });
    expect(moves[0].shiftKey).toBe(true);
    expect(downs[0].shiftKey).toBe(true);
    expect(ups[0].shiftKey).toBe(true);
  });

  it('emits mouseDown with the pressed button for the left and right buttons', () => {
    fire('mousedown', 2, 2, { button: MouseButton.LEFT });
    fire('mouseup', 2, 2, { button: MouseButton.LEFT });
    fire('mousedown', 4, 6, { button: MouseButton.RIGHT });
    expect(downs).toEqual([
      { point: { w: 1, h: 1 }, button: MouseButton.LEFT, outsideCanvas: false, shiftKey: false },
      { point: { w: 2, h: 3 }, button: MouseButton.RIGHT, outsideCanvas: false, shiftKey: false },
    ]);
  });

  it('ignores the middle button, including the mouseup that follows it', () => {
    fire('mousedown', 2, 2, { button: MouseButton.MIDDLE });
    fire('mouseup', 2, 2, { button: MouseButton.MIDDLE });
    expect(downs).toEqual([]);
    expect(ups).toEqual([]);
  });

  it('emits mouseUp only after a mouseDown, and only once per press', () => {
    fire('mouseup', 2, 2);
    expect(ups).toEqual([]);

    fire('mousedown', 2, 2);
    fire('mouseup', 6, 8);
    fire('mouseup', 6, 8);
    expect(ups).toEqual([{ point: { w: 3, h: 4 }, outsideCanvas: false, shiftKey: false }]);
  });

  it('emits a move flagged outsideCanvas when the mouse leaves', () => {
    fire('mouseout', 50, 10);
    expect(moves).toEqual([{ point: { w: 9, h: 5 }, outsideCanvas: true, shiftKey: false }]);
  });

  it('starts a press when the mouse enters with a button already held down', () => {
    fire('mouseover', 4, 4, { buttons: 1 });
    expect(downs).toEqual([{ point: { w: 2, h: 2 }, button: MouseButton.LEFT, outsideCanvas: false, shiftKey: false }]);

    fire('mouseover', 6, 6, { buttons: 1 });
    expect(downs.length, 'no second down while already pressed').toBe(1);
  });

  it('fires the deferred mouseUp at the last mouse-out position when re-entering with no buttons pressed', () => {
    fire('mousedown', 2, 2);
    fire('mouseout', 30, 12);
    fire('mouseover', 8, 8, { buttons: 0 });

    expect(ups).toEqual([{ point: { w: 9, h: 6 }, outsideCanvas: false, shiftKey: false }]);
    fire('mouseup', 8, 8);
    expect(ups.length, 'press is finished').toBe(1);
  });

  it('does nothing when re-entering with no buttons pressed and no press in progress', () => {
    fire('mouseover', 8, 8, { buttons: 0 });
    expect(downs).toEqual([]);
    expect(ups).toEqual([]);
  });

  it('keeps the press alive when the mouse leaves and comes back with the button still held', () => {
    fire('mousedown', 2, 2);
    fire('mouseout', 30, 12);
    fire('mouseover', 8, 8, { buttons: 1 });
    expect(ups).toEqual([]);
    expect(downs.length).toBe(1);
  });

  it('emits the wheel delta in notches (deltaY / -100) with the pointer position', () => {
    tracker().dispatchEvent(
      new WheelEvent('wheel', { deltaY: -100, clientX: RECT_LEFT + 10 * CSS_ZOOM, clientY: RECT_TOP + 10 * CSS_ZOOM })
    );
    tracker().dispatchEvent(new WheelEvent('wheel', { deltaY: 250, clientX: RECT_LEFT, clientY: RECT_TOP }));
    expect(scrolls).toEqual([
      { point: { w: 5, h: 5 }, wheelDelta: 1 },
      { point: { w: 0, h: 0 }, wheelDelta: -2.5 },
    ]);
  });

  it('prevents text selection and the context menu', () => {
    const selectStart: Event = new Event('selectstart', { bubbles: true, cancelable: true });
    tracker().dispatchEvent(selectStart);
    expect(component.onSelectStart()).toBe(false);
    expect(selectStart.defaultPrevented).toBe(true);

    const contextMenu: MouseEvent = fire('contextmenu', 1, 1, { button: MouseButton.RIGHT });
    expect(contextMenu.defaultPrevented).toBe(true);
  });
});

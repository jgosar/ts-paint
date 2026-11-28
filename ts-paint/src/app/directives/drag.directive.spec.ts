import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DragDirective } from './drag.directive';
import { Point } from '../types/base/point';
import { usePageZoom } from '../../testing/page-zoom.helpers';

@Component({
  template: `
    <div
      class="handle"
      style="position: absolute; left: 0; top: 0; width: 50px; height: 20px"
      [tspDrag]="enabled()"
      (dragStart)="events.push('start')"
      (dragMove)="moves.push($event)"
      (dragEnd)="ends.push($event)"
    >
      <button type="button">x</button>
    </div>
  `,
  imports: [DragDirective],
})
class HostComponent {
  enabled = signal(true);
  events: string[] = [];
  moves: Point[] = [];
  ends: Point[] = [];
}

function pointer(type: string, x: number, y: number, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, {
    clientX: x,
    clientY: y,
    button: 0,
    pointerId: 7,
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

describe('DragDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let handle: HTMLElement;
  const pageZoom = usePageZoom();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    handle = fixture.nativeElement.querySelector('.handle');
  });

  it('emits how far the pointer has moved since it was pressed', () => {
    const down: PointerEvent = pointer('pointerdown', 10, 10);
    handle.dispatchEvent(down);
    handle.dispatchEvent(pointer('pointermove', 15, 12));
    handle.dispatchEvent(pointer('pointermove', 30, 4));
    handle.dispatchEvent(pointer('pointerup', 31, 5));

    expect(host.events).toEqual(['start']);
    expect(host.moves).toEqual([
      { w: 5, h: 2 },
      { w: 20, h: -6 },
    ]);
    expect(host.ends).toEqual([{ w: 21, h: -5 }]);
    expect(down.defaultPrevented, 'the press does not move the focus or select text').toBe(true);
  });

  it('ignores moves without a press, other pointers, and other buttons', () => {
    handle.dispatchEvent(pointer('pointermove', 15, 12));
    handle.dispatchEvent(pointer('pointerdown', 10, 10, { button: 2 }));
    handle.dispatchEvent(pointer('pointermove', 15, 12));
    handle.dispatchEvent(pointer('pointerdown', 10, 10));
    handle.dispatchEvent(pointer('pointermove', 50, 50, { pointerId: 8 }));
    handle.dispatchEvent(pointer('pointerdown', 20, 20, { pointerId: 9 }));
    handle.dispatchEvent(pointer('pointercancel', 12, 10));

    expect(host.events).toEqual(['start']);
    expect(host.moves).toEqual([]);
    expect(host.ends).toEqual([{ w: 2, h: 0 }]);
  });

  it('converts the distance into css px of a zoomed page (see PixelScalingService)', () => {
    pageZoom.set('2');
    handle.dispatchEvent(pointer('pointerdown', 10, 10));
    handle.dispatchEvent(pointer('pointermove', 20, 16));
    expect(host.moves).toEqual([{ w: 5, h: 3 }]);
  });

  it('can be switched off', () => {
    host.enabled.set(false);
    fixture.detectChanges();
    handle.dispatchEvent(pointer('pointerdown', 10, 10));
    handle.dispatchEvent(pointer('pointermove', 15, 12));
    expect(host.events).toEqual([]);
    expect(host.moves).toEqual([]);
  });

  it('leaves presses on a button inside alone, so the button can be clicked', () => {
    const down: PointerEvent = pointer('pointerdown', 10, 10);
    handle.querySelector('button').dispatchEvent(down);
    expect(host.events).toEqual([]);
    expect(down.defaultPrevented).toBe(false);
  });
});

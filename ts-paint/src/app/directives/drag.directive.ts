import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Point } from '../types/base/point';

/**
 * Makes an element draggable with the mouse, a pen or a finger. While the primary button is held it emits how far the
 * pointer has moved since the drag started, in the element's own css px (see PixelScalingService for why client
 * coordinates are converted). The pointer is captured, so the drag goes on outside the element, and the press does
 * not move the focus (a text box keeps its caret).
 */
@Directive({
  selector: '[tspDrag]',
  standalone: true,
})
export class DragDirective {
  /** Set to false to switch dragging off */
  @Input()
  tspDrag: boolean | '' = true;
  @Output()
  dragStart: EventEmitter<void> = new EventEmitter<void>();
  @Output()
  dragMove: EventEmitter<Point> = new EventEmitter<Point>();
  @Output()
  dragEnd: EventEmitter<Point> = new EventEmitter<Point>();

  private _pointerId: number | undefined;
  private _startX: number;
  private _startY: number;
  private _scale: number;

  constructor(private _element: ElementRef<HTMLElement>) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent) {
    const onButton: boolean = (event.target as Element).closest?.('button') !== null;
    if (this.tspDrag === false || event.button !== 0 || this._pointerId !== undefined || onButton) {
      // A button inside the element (like a window's close button) stays clickable
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const element: HTMLElement = this._element.nativeElement;
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Not an active pointer (a synthetic event): the drag still works while the pointer stays on the element
    }
    const rect: DOMRect = element.getBoundingClientRect();
    this._scale = rect.width > 0 ? element.offsetWidth / rect.width : 1;
    this._pointerId = event.pointerId;
    this._startX = event.clientX;
    this._startY = event.clientY;
    this.dragStart.emit();
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent) {
    if (event.pointerId === this._pointerId) {
      this.dragMove.emit(this.getDelta(event));
    }
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  onPointerUp(event: PointerEvent) {
    if (event.pointerId === this._pointerId) {
      this._pointerId = undefined;
      this.dragEnd.emit(this.getDelta(event));
    }
  }

  private getDelta(event: PointerEvent): Point {
    return { w: (event.clientX - this._startX) * this._scale, h: (event.clientY - this._startY) * this._scale };
  }
}

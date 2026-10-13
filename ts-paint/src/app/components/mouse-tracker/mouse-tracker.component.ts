import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Point } from '../../types/base/point';
import { TspMouseEvent } from 'src/app/types/mouse-tracker/tsp-mouse-event';
import { TspPinchEvent } from 'src/app/types/mouse-tracker/tsp-pinch-event';
import { MouseButton } from 'src/app/types/mouse-tracker/mouse-button';
import { constrainPointToImage, unzoomPoint } from 'src/app/helpers/image.helpers';
import { ClientPoint, TouchGesture, TouchGestureRecognizer, TouchPoint } from './touch-gesture-recognizer';

/**
 * The invisible layer over the image that turns mouse and touch input into events in image pixels. Touch input goes
 * through a TouchGestureRecognizer: one finger scrolls (left to the browser), a tap followed by a drag draws like a
 * left mouse button, two fingers pinch to zoom.
 */
@Component({
  selector: 'tsp-mouse-tracker',
  templateUrl: './mouse-tracker.component.html',
  styleUrls: ['./mouse-tracker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MouseTrackerComponent implements OnChanges, OnDestroy {
  @Input()
  zoom: number = 1;
  @Input()
  image: ImageData;
  @Output()
  mouseMove: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();
  @Output()
  mouseUp: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();
  @Output()
  mouseDown: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();
  @Output()
  mouseScroll: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();
  @Output()
  pinchZoom: EventEmitter<TspPinchEvent> = new EventEmitter<TspPinchEvent>();

  zoomedWidth: number = 0;
  zoomedHeight: number = 0;
  private _mouseIsDown: boolean = false;
  private _lastMouseOut: MouseEvent;
  private _touchGestures: TouchGestureRecognizer = new TouchGestureRecognizer(this.onTouchGesture.bind(this));
  @ViewChild('trackerDiv', { static: true })
  private _trackerDiv: ElementRef<HTMLDivElement>;

  ngOnChanges(): void {
    this.zoomedWidth = (this.image?.width ?? 1) * this.zoom;
    this.zoomedHeight = (this.image?.height ?? 1) * this.zoom;
  }

  ngOnDestroy(): void {
    this._touchGestures.destroy();
  }

  onSelectStart(): boolean {
    return false;
  }

  onMouseMove(event: MouseEvent, outsideCanvas: boolean = false) {
    this.mouseMove.emit({
      point: this.getEventPoint(event),
      outsideCanvas,
      shiftKey: event.shiftKey,
    });
  }

  onMouseIn(event: MouseEvent) {
    if (!this._mouseIsDown && event.buttons !== 0) {
      this.onMouseDown(event);
    }
    if (this._mouseIsDown && event.buttons === 0) {
      this.onMouseUp(this._lastMouseOut || event);
    }
  }

  onMouseOut(event: MouseEvent) {
    this.onMouseMove(event, true);
    this._lastMouseOut = event;
  }

  onMouseUp(event: MouseEvent) {
    if (this._mouseIsDown) {
      this._mouseIsDown = false;
      this.mouseUp.emit({
        point: this.getEventPoint(event),
        outsideCanvas: false,
        shiftKey: event.shiftKey,
      });
    }
  }

  onMouseDown(event: MouseEvent) {
    if (event.button !== MouseButton.MIDDLE) {
      this._mouseIsDown = true;
      this.mouseDown.emit({
        point: this.getEventPoint(event),
        button: event.button,
        outsideCanvas: false,
        shiftKey: event.shiftKey,
      });
    }
  }

  onMouseScroll(event: WheelEvent) {
    const wheelDelta: number = event.deltaY !== undefined ? event.deltaY / -100 : event.detail / -3;
    this.mouseScroll.emit({ point: this.getEventPoint(event), wheelDelta });
  }

  onTouchStart(event: TouchEvent) {
    this.preventIf(event, this._touchGestures.touchStart(touchPoints(event.touches), touchPoints(event.changedTouches)));
  }

  onTouchMove(event: TouchEvent) {
    this.preventIf(event, this._touchGestures.touchMove(touchPoints(event.touches)));
  }

  onTouchEnd(event: TouchEvent) {
    this.preventIf(event, this._touchGestures.touchEnd(touchPoints(event.touches), touchPoints(event.changedTouches)));
  }

  onTouchCancel(event: TouchEvent) {
    this.preventIf(event, this._touchGestures.touchCancel(touchPoints(event.touches), touchPoints(event.changedTouches)));
  }

  private onTouchGesture(gesture: TouchGesture) {
    switch (gesture.type) {
      case 'press':
        this.mouseDown.emit({
          point: this.getEventPoint(gesture.point),
          button: MouseButton.LEFT,
          outsideCanvas: false,
          shiftKey: false,
        });
        break;
      case 'drag':
        this.mouseMove.emit({ point: this.getEventPoint(gesture.point), outsideCanvas: false, shiftKey: false });
        break;
      case 'release':
        this.mouseUp.emit({ point: this.getEventPoint(gesture.point), outsideCanvas: false, shiftKey: false });
        break;
      case 'pinch':
        this.pinchZoom.emit({ point: this.getEventPoint(gesture.centre), zoomIn: gesture.zoomIn });
        break;
    }
  }

  private preventIf(event: TouchEvent, prevent: boolean) {
    if (prevent && event.cancelable) {
      event.preventDefault();
    }
  }

  private getEventPoint(event: ClientPoint): Point {
    // The bounding rect is affected by CSS zoom (see PixelScalingService) while zoomedWidth is not, so the ratio
    // between them converts client coordinates into the tracker's own coordinate space.
    const rect: DOMRect = this._trackerDiv.nativeElement.getBoundingClientRect();
    const scale: number = rect.width > 0 ? this.zoomedWidth / rect.width : 1;
    const localPoint: Point = { w: (event.clientX - rect.left) * scale, h: (event.clientY - rect.top) * scale };
    const eventPoint: Point = unzoomPoint(localPoint, this.zoom);
    return constrainPointToImage(this.image, eventPoint);
  }
}

function touchPoints(touches: TouchList): TouchPoint[] {
  return Array.from(touches, (touch) => ({
    identifier: touch.identifier,
    clientX: touch.clientX,
    clientY: touch.clientY,
  }));
}

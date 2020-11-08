import { Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { Point } from '../../types/base/point';
import { MouseButtonEvent } from '../../types/mouse-tracker/mouse-button-event';
import { MouseWheelEvent } from '../../types/mouse-tracker/mouse-wheel-event';
import { MousePoint } from 'src/app/types/mouse-tracker/mouse-point';
import { MouseButton } from 'src/app/types/mouse-tracker/mouse-button';
import { constrainPointToImage } from 'src/app/helpers/image.helpers';

@Component({
  selector: 'tsp-mouse-tracker',
  templateUrl: './mouse-tracker.component.html',
  styleUrls: ['./mouse-tracker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MouseTrackerComponent implements OnChanges {
  @Input()
  zoom: number = 1;
  @Input()
  image: ImageData;
  @Output()
  mouseMove: EventEmitter<MousePoint> = new EventEmitter<MousePoint>();
  @Output()
  mouseUp: EventEmitter<MousePoint> = new EventEmitter<MousePoint>();
  @Output()
  mouseDown: EventEmitter<MouseButtonEvent> = new EventEmitter<MouseButtonEvent>();
  @Output()
  mouseScroll: EventEmitter<MouseWheelEvent> = new EventEmitter<MouseWheelEvent>();

  zoomedWidth: number = 0;
  zoomedHeight: number = 0;
  private _mouseIsDown: boolean = false;
  private _lastMouseOut: MouseEvent;

  ngOnChanges(): void {
    this.zoomedWidth = (this.image?.width ?? 1) * this.zoom;
    this.zoomedHeight = (this.image?.height ?? 1) * this.zoom;
  }

  onSelectStart(): boolean {
    return false;
  }

  onMouseMove(event: MouseEvent, outsideCanvas: boolean = false) {
    this.mouseMove.emit({
      point: this.getEventPoint(event),
      outsideCanvas,
      shiftKey: event.shiftKey
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
        shiftKey: event.shiftKey
      });
    }
  }

  onMouseDown(event: MouseEvent) {
    if (event.button !== MouseButton.MIDDLE) {
      this._mouseIsDown = true;
      this.mouseDown.emit({ point: this.getEventPoint(event), button: event.button });
    }
  }

  onMouseScroll(event: WheelEvent) {
    const wheelDelta: number = event.deltaY !== undefined ? event.deltaY / -100 : event.detail / -3;
    this.mouseScroll.emit({ point: this.getEventPoint(event), wheelDelta });
  }

  private getEventPoint(event: MouseEvent | WheelEvent): Point {
    // @ts-ignore
    const eventPoint: Point = this.unzoomPoint({ w: event.layerX, h: event.layerY });
    return constrainPointToImage(this.image, eventPoint);
  }

  private unzoomPoint(zoomedPoint: Point): Point {
    return { w: Math.floor(zoomedPoint.w / this.zoom), h: Math.floor(zoomedPoint.h / this.zoom) };
  }
}

import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Point } from 'src/app/types/base/point';
import { MouseButtonEvent } from 'src/app/types/mouse-tracker/mouse-button-event';
import { MouseButton } from 'src/app/types/mouse-tracker/mouse-button';
import { MouseWheelEvent } from 'src/app/types/mouse-tracker/mouse-wheel-event';

@Component({
  selector: 'tsp-mouse-tracker',
  templateUrl: './mouse-tracker.component.html',
  styleUrls: ['./mouse-tracker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MouseTrackerComponent implements OnChanges {
  @Input()
  zoom: number = 1;
  @Input()
  image: ImageData;
  @Output()
  mouseMove: EventEmitter<Point> = new EventEmitter<Point>();
  @Output()
  mouseUp: EventEmitter<Point> = new EventEmitter<Point>();
  @Output()
  mouseDown: EventEmitter<MouseButtonEvent> = new EventEmitter<MouseButtonEvent>();
  @Output()
  mouseScroll: EventEmitter<MouseWheelEvent> = new EventEmitter<MouseWheelEvent>();

  zoomedWidth: number = 0;
  zoomedHeight: number = 0;
  private _mouseIsDown: boolean = false;
  private _lastMouseOut: MouseEvent;

  ngOnChanges(changes: SimpleChanges): void {
    this.zoomedWidth = (this.image?.width ?? 0) * this.zoom;
    this.zoomedHeight = (this.image?.height ?? 0) * this.zoom;
  }

  onSelectStart(): boolean {
    return false;
  }

  onMouseMove(event: MouseEvent) {
    this.mouseMove.emit(this.getUnzoomedPoint(event));
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
    this._lastMouseOut = event;
  }

  onMouseUp(event: MouseEvent) {
    this._mouseIsDown = false;
    this.mouseUp.emit(this.getUnzoomedPoint(event));
  }

  onMouseDown(event: MouseEvent) {
    this._mouseIsDown = true;
    this.mouseDown.emit({ point: this.getUnzoomedPoint(event), button: event.button });
  }

  onMouseScroll(event: WheelEvent) {
    const wheelDelta: number = event.deltaY !== undefined ? event.deltaY / (-100) : event.detail / (-3);
    this.mouseScroll.emit({ point: this.getUnzoomedPoint(event), wheelDelta: wheelDelta });
  }

  private getUnzoomedPoint(event: MouseEvent | WheelEvent) {
    //@ts-ignore
    return this.unzoomPoint({ w: event.layerX, h: event.layerY });
  }

  private unzoomPoint(zoomedPoint: Point): Point {
    return { w: Math.floor(zoomedPoint.w / this.zoom), h: Math.floor(zoomedPoint.h / this.zoom) };
  }
}

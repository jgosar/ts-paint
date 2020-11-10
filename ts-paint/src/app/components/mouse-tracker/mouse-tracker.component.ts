import { Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { Point } from '../../types/base/point';
import { TspMouseEvent } from 'src/app/types/mouse-tracker/tsp-mouse-event';
import { MouseButton } from 'src/app/types/mouse-tracker/mouse-button';
import { constrainPointToImage, unzoomPoint } from 'src/app/helpers/image.helpers';

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
  mouseMove: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();
  @Output()
  mouseUp: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();
  @Output()
  mouseDown: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();
  @Output()
  mouseScroll: EventEmitter<TspMouseEvent> = new EventEmitter<TspMouseEvent>();

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

  private getEventPoint(event: MouseEvent | WheelEvent): Point {
    // @ts-ignore
    const eventPoint: Point = unzoomPoint({ w: event.layerX, h: event.layerY }, this.zoom);
    return constrainPointToImage(this.image, eventPoint);
  }
}

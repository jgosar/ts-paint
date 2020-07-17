import { MouseButtonEvent } from '../mouse-tracker/mouse-button-event';
import { Point } from '../base/point';
import { MoveSelectionAction } from '../actions/move-selection-action';
import { MousePoint } from '../mouse-tracker/mouse-point';

export class MoveSelectionTool {
  constructor(private _addAction: (action: MoveSelectionAction) => void) {}

  private _mouseIsDown: boolean;
  private _mouseDownPoint: Point;
  private _currentPosition: Point;

  mouseDown(startingPosition: Point, event: MouseButtonEvent) {
    this._currentPosition = startingPosition;
    this._mouseIsDown = true;
    this._mouseDownPoint = event.point;
  }

  mouseUp(point: Point) {
    const position: Point = this.calculateNewSelectionPosition(point);
    this._addAction(new MoveSelectionAction(position));

    this._mouseIsDown = false;
    this._mouseDownPoint = undefined;
    this._currentPosition = position;
  }

  mouseMove(mousePoint: MousePoint) {
    if (this._mouseIsDown) {
      const position: Point = this.calculateNewSelectionPosition(mousePoint.point);
      this._addAction(new MoveSelectionAction(position));
    }
  }

  private calculateNewSelectionPosition(mousePosition: Point): Point {
    const w: number = mousePosition.w - this._mouseDownPoint.w + this._currentPosition.w;
    const h: number = mousePosition.h - this._mouseDownPoint.h + this._currentPosition.h;

    return { w, h };
  }
}

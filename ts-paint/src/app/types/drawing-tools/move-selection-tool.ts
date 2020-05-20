import { MouseButtonEvent } from '../mouse-tracker/mouse-button-event';
import { Point } from '../base/point';
import { MoveSelectionAction } from '../actions/move-selection-action';

export class MoveSelectionTool {

  constructor(startingPosition: Point, private _addAction: (action: MoveSelectionAction) => void) {
    this._currentPosition = startingPosition;
  }

  private _mouseIsDown: boolean;
  private _mouseDownPoint: Point;
  private _currentPosition: Point;

  mouseDown(event: MouseButtonEvent) {
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

  mouseMove(point: Point) {
    if (this._mouseIsDown) {
      const position: Point = this.calculateNewSelectionPosition(point);
      this._addAction(new MoveSelectionAction(position));
    }
  }

  private calculateNewSelectionPosition(mousePosition: Point): Point {
    const w: number = mousePosition.w - this._mouseDownPoint.w + this._currentPosition.w;
    const h: number = mousePosition.h - this._mouseDownPoint.h + this._currentPosition.h;

    return { w, h };
  }
}

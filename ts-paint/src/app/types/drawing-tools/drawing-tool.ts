import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { DrawingToolAction } from './drawing-tool-action';
import { MouseButtonEvent } from '../mouse-tracker/mouse-button-event';
import { Point } from '../base/point';
import { DrawingToolType } from './drawing-tool-type';
import { assertUnreachable } from 'src/app/helpers/typescript.helpers';

export class DrawingTool {
  private readonly _behaviour: DrawingToolBehaviour;
  private readonly _maxPoints: number;

  constructor(public type: DrawingToolType, private addAction: (action: DrawingToolAction) => void) {
    switch (type) {
      /*case DrawingToolType.freeFormSelect:
        this._behaviour = DrawingToolBehaviour.FREE_DRAW;
        return;
      case DrawingToolType.rectangleSelect:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      case DrawingToolType.eraser:
        this._behaviour = DrawingToolBehaviour.FREE_DRAW;
        return;
      case DrawingToolType.colorFiller:
        this._behaviour = DrawingToolBehaviour.SINGLE_POINT;
        return;
      case DrawingToolType.colorPicker:
        this._behaviour = DrawingToolBehaviour.SINGLE_POINT;
        return;
      case DrawingToolType.magnifier:
        this._behaviour = DrawingToolBehaviour.SINGLE_POINT;
        return;*/
      case DrawingToolType.pencil:
        this._behaviour = DrawingToolBehaviour.FREE_DRAW;
        return;
      /*case DrawingToolType.brush:
        this._behaviour = DrawingToolBehaviour.FREE_DRAW;
        return;
      case DrawingToolType.airbrush:
        this._behaviour = DrawingToolBehaviour.FREE_DRAW;
        return;
      case DrawingToolType.text:
        this._behaviour = DrawingToolBehaviour.TEXT;
        return;*/
      case DrawingToolType.line:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      /*case DrawingToolType.curve:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 4;
        return;
      case DrawingToolType.rectangle:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      case DrawingToolType.polygon:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        return;
      case DrawingToolType.ellipse:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      case DrawingToolType.roundedRectangle:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      case DrawingToolType.moveSelection:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;*/
    }

    assertUnreachable(type);
  }

  private _mouseIsDown: boolean
  private _mouseDownPoint: Point;
  private _mousePoints: Point[] = [];

  mouseDown(event: MouseButtonEvent) {
    this._mouseIsDown = true;

    if (this._behaviour == DrawingToolBehaviour.CLICK_AND_DRAG) {
      this._mouseDownPoint = event.point;
    } else if (this._behaviour == DrawingToolBehaviour.FREE_DRAW) {
      this._mousePoints.push(event.point);
    }
  }

  mouseUp(point: Point) {
    this._mouseIsDown = false;

    if (this._behaviour == DrawingToolBehaviour.CLICK_AND_DRAG) {
      this.addAction({ tool: this.type, points: [this._mouseDownPoint, point], preview: false });
      this.clearData();
    } else if (this._behaviour == DrawingToolBehaviour.FREE_DRAW) {
      this._mousePoints.push(point);
      this.addAction({ tool: this.type, points: this._mousePoints, preview: false });
      this.clearData();
    }
  }

  mouseMove(point: Point) {
    if (this._behaviour == DrawingToolBehaviour.CLICK_AND_DRAG) {
      if (this._mouseIsDown) {
        this.addAction({ tool: this.type, points: [this._mouseDownPoint, point], preview: true });
      }
    } else if (this._behaviour == DrawingToolBehaviour.FREE_DRAW) {
      if (this._mouseIsDown) {
        this._mousePoints.push(point);
        this.addAction({ tool: this.type, points: this._mousePoints, preview: true });
      }
    }
  }

  private clearData() {
    this._mouseIsDown = undefined;
    this._mouseDownPoint = undefined;
    this._mousePoints = [];
  }
}
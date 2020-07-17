import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { MouseButtonEvent } from '../mouse-tracker/mouse-button-event';
import { Point } from '../base/point';
import { DrawingToolType } from './drawing-tool-type';
import { assertUnreachable } from '../../helpers/typescript.helpers';
import { MouseButton } from '../mouse-tracker/mouse-button';
import { createDrawingToolAction } from '../actions/drawing-tool-actions/create-drawing-tool-action';
import { TsPaintAction } from '../actions/ts-paint-action';
import { MousePoint } from '../mouse-tracker/mouse-point';

export class DrawingTool {
  private readonly _behaviour: DrawingToolBehaviour;
  private readonly _maxPoints: number;

  constructor(
    public type: DrawingToolType,
    private _addAction: (action: TsPaintAction) => void,
    private _clearPreview: () => void
  ) {
    switch (type) {
      /*case DrawingToolType.freeFormSelect:
        this._behaviour = DrawingToolBehaviour.FREE_DRAW;
        return;*/
      case DrawingToolType.rectangleSelect:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      /*case DrawingToolType.eraser:
        this._behaviour = DrawingToolBehaviour.FREE_DRAW;
        return;*/
      case DrawingToolType.colorFiller:
        this._behaviour = DrawingToolBehaviour.SINGLE_POINT;
        return;
      case DrawingToolType.colorPicker:
        this._behaviour = DrawingToolBehaviour.SINGLE_POINT;
        return;
      case DrawingToolType.magnifier:
        this._behaviour = DrawingToolBehaviour.SINGLE_POINT_WITH_PREVIEW;
        this.helpText = 'Changes the magnification: left click to zoom in, right click to zoom out.';
        return;
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
        return;*/
      case DrawingToolType.rectangle:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      /*case DrawingToolType.polygon:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        return;*/
      case DrawingToolType.ellipse:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
      /*case DrawingToolType.roundedRectangle:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;*/
    }

    assertUnreachable(type);
  }

  public readonly helpText: string = '';
  public previewShapeStart: Point;
  public previewShapeDimensions: Point;

  private _mouseIsDown: boolean;
  private _mouseDownPoint: Point;
  private _mousePoints: Point[] = [];
  private _swapColors: boolean;

  mouseDown(event: MouseButtonEvent) {
    this._mouseIsDown = true;
    this._swapColors = event.button !== MouseButton.LEFT;

    if (this._behaviour === DrawingToolBehaviour.CLICK_AND_DRAG) {
      this._mouseDownPoint = event.point;
    } else if (this._behaviour === DrawingToolBehaviour.FREE_DRAW) {
      this._mousePoints.push(event.point);
    }
  }

  mouseUp(point: Point) {
    this._mouseIsDown = false;

    if (this._behaviour === DrawingToolBehaviour.CLICK_AND_DRAG) {
      if (this._maxPoints === 2) {
        this.addFinalAction([this._mouseDownPoint, point]);
      } else {
        // TODO: Handle click & drag with multiple points
      }
    } else if (this._behaviour === DrawingToolBehaviour.FREE_DRAW) {
      this._mousePoints.push(point);
      this.addFinalAction(this._mousePoints);
    } else if (this._behaviour === DrawingToolBehaviour.SINGLE_POINT) {
      this._mousePoints = [point];
      this.addFinalAction(this._mousePoints);
    }
  }

  mouseMove(mousePoint: MousePoint) {
    const point: Point = mousePoint.point;
    if (this._behaviour === DrawingToolBehaviour.CLICK_AND_DRAG) {
      if (this._mouseIsDown) {
        this.addPreviewAction([this._mouseDownPoint, point]);
      }
    } else if (this._behaviour === DrawingToolBehaviour.FREE_DRAW) {
      if (this._mouseIsDown) {
        this._mousePoints.push(point);
        this.addPreviewAction(this._mousePoints);
      }
    } else if (this._behaviour === DrawingToolBehaviour.SINGLE_POINT_WITH_PREVIEW) {
      if (mousePoint.outsideCanvas) {
        this._clearPreview();
      } else {
        this.addPreviewAction([point]);
      }
    }
  }

  private addPreviewAction(points: Point[]) {
    this.previewShapeStart = points[0];
    this.previewShapeDimensions = this.calculateDimensions(points[0], points[points.length - 1]);
    const action: TsPaintAction = createDrawingToolAction(this.type, points, this._swapColors, 'preview');
    this._addAction(action);
  }

  private addFinalAction(points: Point[]) {
    const action: TsPaintAction = createDrawingToolAction(this.type, points, this._swapColors, 'image');
    this._addAction(action);
    this.clearData();
  }

  private clearData() {
    this.previewShapeStart = undefined;
    this.previewShapeDimensions = undefined;
    this._mouseIsDown = undefined;
    this._mouseDownPoint = undefined;
    this._mousePoints = [];
    this._swapColors = undefined;
  }

  private calculateDimensions(start: Point, end: Point): Point {
    let dw: number = end.w - start.w;
    if (dw >= 0) {
      dw++;
    } else {
      dw--;
    }
    let dh: number = end.h - start.h;
    if (dh >= 0) {
      dh++;
    } else {
      dh--;
    }

    return { w: dw, h: dh };
  }
}

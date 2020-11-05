import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { MouseButtonEvent } from '../mouse-tracker/mouse-button-event';
import { Point } from '../base/point';
import { DrawingToolType } from './drawing-tool-type';
import { MouseButton } from '../mouse-tracker/mouse-button';
import { TsPaintAction } from '../actions/ts-paint-action';
import { MousePoint } from '../mouse-tracker/mouse-point';
import { DrawingToolConfig, DRAWING_TOOL_CONFIG } from './drawing-tool-config';
import { calculateShapeDimensions } from 'src/app/helpers/drawing.helpers';

export class DrawingTool {
  private readonly _config: DrawingToolConfig;

  get helpText(): string{
    return this._config.helpText??'';
  }

  get invertedPreview(): boolean{
    return this._config.invertedPreview??false;
  }

  constructor(
    public type: DrawingToolType,
    private _addAction: (action: TsPaintAction) => void,
    private _clearPreview: () => void
  ) {
    this._config = {...DRAWING_TOOL_CONFIG[type]};
  }

  public previewShapeStart: Point;
  public previewShapeDimensions: Point;

  private _mouseIsDown: boolean;
  private _mouseDownPoint: Point;
  private _mousePoints: Point[] = [];
  private _swapColors: boolean;

  mouseDown(event: MouseButtonEvent) {
    this._mouseIsDown = true;
    this._swapColors = event.button !== MouseButton.LEFT;

    if (this._config.behaviour === DrawingToolBehaviour.CLICK_AND_DRAG) {
      this._mouseDownPoint = event.point;
    } else if (this._config.behaviour === DrawingToolBehaviour.FREE_DRAW) {
      this._mousePoints.push(event.point);
    }
  }

  mouseUp(point: Point) {
    this._mouseIsDown = false;

    if (this._config.behaviour === DrawingToolBehaviour.CLICK_AND_DRAG) {
      if (this._config.maxPoints === 2) {
        this.addFinalAction([this._mouseDownPoint, point]);
      } else {
        // TODO: Handle click & drag with multiple points
      }
    } else if (this._config.behaviour === DrawingToolBehaviour.FREE_DRAW) {
      this._mousePoints.push(point);
      this.addFinalAction(this._mousePoints);
    } else if (
      [DrawingToolBehaviour.SINGLE_POINT, DrawingToolBehaviour.SINGLE_POINT_WITH_PREVIEW].includes(this._config.behaviour)
    ) {
      this._mousePoints = [point];
      this.addFinalAction(this._mousePoints);
    }
  }

  mouseMove(mousePoint: MousePoint) {
    const point: Point = mousePoint.point;
    if (this._config.behaviour === DrawingToolBehaviour.CLICK_AND_DRAG) {
      if (this._mouseIsDown) {
        this.addPreviewAction([this._mouseDownPoint, point]);
      }
    } else if (this._config.behaviour === DrawingToolBehaviour.FREE_DRAW) {
      if (this._mouseIsDown) {
        this._mousePoints.push(point);
        this.addPreviewAction(this._mousePoints);
      }
    } else if (this._config.behaviour === DrawingToolBehaviour.SINGLE_POINT_WITH_PREVIEW) {
      if (mousePoint.outsideCanvas) {
        this._clearPreview();
      } else {
        this.addPreviewAction([point]);
      }
    }
  }

  private addPreviewAction(points: Point[]) {
    this.previewShapeStart = points[0];
    this.previewShapeDimensions = calculateShapeDimensions(points[0], points[points.length - 1]);
    const action: TsPaintAction = new this._config.actionClass(points, this._swapColors, 'preview');
    this._addAction(action);
  }

  private addFinalAction(points: Point[]) {
    const action: TsPaintAction = new this._config.actionClass(points, this._swapColors, 'image');
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
}

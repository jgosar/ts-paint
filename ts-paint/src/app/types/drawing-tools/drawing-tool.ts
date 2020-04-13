import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { DrawingToolAction } from './drawing-tool-action';
import { MouseButtonEvent } from '../mouse-tracker/mouse-button-event';
import { Point } from '../base/point';
import { DrawingToolType } from './drawing-tool-type';

export abstract class DrawingTool {
  constructor(private addAction: (action: DrawingToolAction) => void, private type: DrawingToolType, behaviour: DrawingToolBehaviour, maxPoints?: number, hidden?: boolean) {

  }

  private mouseIsDown: boolean
  private mouseDownPoint: Point;

  /*  private mouseIsDown: boolean
  private mouseDownPoint: Point;

  mouseDown(point: Point) {
    this.mouseIsDown = true;
    this.mouseDownPoint = point;

    this.paintArea(point.w, point.h, point.w, point.h);
  }

  mouseUp(point: Point) {
    this.mouseIsDown = false;
    this.saveChanges();
  }

  mouseMove(point: Point) {
    if (this.mouseIsDown) {
      this.clearChanges();
      this.paintLine(this.mouseDownPoint, point);
    }
  } */

  mouseDown(event: MouseButtonEvent) {
    this.mouseIsDown = true;
    this.mouseDownPoint = event.point;
  }

  mouseUp(point: Point) {
    this.mouseIsDown = false;
    this.addAction({ tool: this.type, points: [this.mouseDownPoint, point], preview: false });
  }

  mouseMove(point: Point) {
    if (this.mouseIsDown) {
      this.addAction({ tool: this.type, points: [this.mouseDownPoint, point], preview: true });
    }
  }
}
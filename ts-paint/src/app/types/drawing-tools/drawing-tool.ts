import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { DrawingToolAction } from './drawing-tool-action';
import { MouseButtonEvent } from '../mouse-tracker/mouse-button-event';
import { Point } from '../base/point';
import { DrawingToolType } from './drawing-tool-type';
import { assertUnreachable } from 'src/app/helpers/typescript.helpers';

export class DrawingTool {
  private readonly _behaviour: DrawingToolBehaviour;
  private readonly _maxPoints: number;

  constructor(private type: DrawingToolType, private addAction: (action: DrawingToolAction) => void) {
    switch (type) {
      case DrawingToolType.line:
        this._behaviour = DrawingToolBehaviour.CLICK_AND_DRAG;
        this._maxPoints = 2;
        return;
    }

    assertUnreachable(type);
  }

  private mouseIsDown: boolean
  private mouseDownPoint: Point;

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
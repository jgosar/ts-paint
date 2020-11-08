import { ColorFillerAction } from '../actions/drawing-tool-actions/color-filler-action';
import { ColorPickerAction } from '../actions/drawing-tool-actions/color-picker-action';
import { DrawingToolAction } from '../actions/drawing-tool-actions/drawing-tool-action';
import { EllipseAction } from '../actions/drawing-tool-actions/ellipse-action';
import { LineAction } from '../actions/drawing-tool-actions/line-action';
import { MagnifierAction } from '../actions/drawing-tool-actions/magnifier-action';
import { PencilAction } from '../actions/drawing-tool-actions/pencil-action';
import { RectangleAction } from '../actions/drawing-tool-actions/rectangle-action';
import { RectangleSelectAction } from '../actions/drawing-tool-actions/rectangle-select-action';
import { Point } from '../base/point';
import { DrawingToolAngleSnap } from './drawing-tool-angle-snap';
import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { DrawingToolType } from './drawing-tool-type';

interface PartialDrawingToolConfig {
  behaviour: DrawingToolBehaviour;
  maxPoints: number;
  helpText: string;
  invertedPreview: boolean;
  angleSnap: DrawingToolAngleSnap;
}

export interface DrawingToolConfig extends PartialDrawingToolConfig {
  actionClass: new (points: Point[], swapColors: boolean, renderIn: 'image' | 'preview') => DrawingToolAction;
}

export const DRAWING_TOOL_CONFIG_DEFAULTS: PartialDrawingToolConfig = {
  behaviour: DrawingToolBehaviour.SINGLE_POINT,
  maxPoints: 1,
  helpText: '',
  invertedPreview: false,
  angleSnap: DrawingToolAngleSnap.NONE,
};

export const DRAWING_TOOL_CONFIG: { [key in DrawingToolType]: DrawingToolConfig } = {
  [DrawingToolType.rectangleSelect]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
    maxPoints: 2,
    invertedPreview: true,
    actionClass: RectangleSelectAction,
  },
  [DrawingToolType.colorFiller]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    actionClass: ColorFillerAction,
  },
  [DrawingToolType.colorPicker]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    actionClass: ColorPickerAction,
  },
  [DrawingToolType.magnifier]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    behaviour: DrawingToolBehaviour.SINGLE_POINT_WITH_PREVIEW,
    helpText: 'Changes the magnification: left click to zoom in, right click to zoom out.',
    invertedPreview: true,
    actionClass: MagnifierAction,
  },
  [DrawingToolType.pencil]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    behaviour: DrawingToolBehaviour.FREE_DRAW,
    actionClass: PencilAction,
  },
  [DrawingToolType.line]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
    maxPoints: 2,
    angleSnap: DrawingToolAngleSnap.EVERY_45_DEGREES,
    actionClass: LineAction,
  },
  [DrawingToolType.rectangle]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
    maxPoints: 2,
    angleSnap: DrawingToolAngleSnap.DIAGONAL,
    actionClass: RectangleAction,
  },
  [DrawingToolType.ellipse]: {
    ...DRAWING_TOOL_CONFIG_DEFAULTS,
    behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
    maxPoints: 2,
    angleSnap: DrawingToolAngleSnap.DIAGONAL,
    actionClass: EllipseAction,
  },
};

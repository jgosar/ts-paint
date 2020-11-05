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
import { DrawingToolBehaviour } from './drawing-tool-behaviour';
import { DrawingToolType } from './drawing-tool-type';

interface PartialDrawingToolConfig{
  behaviour: DrawingToolBehaviour,
  maxPoints: number,
  helpText: string,
  invertedPreview: boolean
}

export interface DrawingToolConfig extends PartialDrawingToolConfig{
  createAction: (points: Point[], swapColors: boolean, renderIn: 'image' | 'preview')=>DrawingToolAction
}

export const DRAWING_TOOL_CONFIG_DEFAULTS: PartialDrawingToolConfig = {
      behaviour: DrawingToolBehaviour.SINGLE_POINT,
      maxPoints: 1,
      helpText:'',
      invertedPreview: false
}

export const DRAWING_TOOL_CONFIG: {[key in DrawingToolType]: DrawingToolConfig} = {
  [DrawingToolType.rectangleSelect]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2,
      invertedPreview: true,
      createAction: (points, swapColors, renderIn)=>new RectangleSelectAction(points, swapColors, renderIn)
  },
  [DrawingToolType.colorFiller]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      createAction: (points, swapColors, renderIn)=>new ColorFillerAction(points, swapColors, renderIn)
  },
  [DrawingToolType.colorPicker]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      createAction: (points, swapColors, renderIn)=>new ColorPickerAction(points, swapColors, renderIn)
  },
  [DrawingToolType.magnifier]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      behaviour: DrawingToolBehaviour.SINGLE_POINT_WITH_PREVIEW,
      helpText: 'Changes the magnification: left click to zoom in, right click to zoom out.',
      invertedPreview: true,
      createAction: (points, swapColors, renderIn)=>new MagnifierAction(points, swapColors, renderIn)
  },
  [DrawingToolType.pencil]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      behaviour: DrawingToolBehaviour.FREE_DRAW,
      createAction: (points, swapColors, renderIn)=>new PencilAction(points, swapColors, renderIn)
  },
  [DrawingToolType.line]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2,
      createAction: (points, swapColors, renderIn)=>new LineAction(points, swapColors, renderIn)
  },
  [DrawingToolType.rectangle]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2,
      createAction: (points, swapColors, renderIn)=>new RectangleAction(points, swapColors, renderIn)
  },
  [DrawingToolType.ellipse]:{
      ...DRAWING_TOOL_CONFIG_DEFAULTS,
      behaviour: DrawingToolBehaviour.CLICK_AND_DRAG,
      maxPoints: 2,
      createAction: (points, swapColors, renderIn)=>new EllipseAction(points, swapColors, renderIn)
  }
}

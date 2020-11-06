import { DrawingToolType } from './drawing-tool-type';

export interface DrawingToolOptions{
  [DrawingToolType.rectangle]: RectangleOptions;
}

export interface RectangleOptions{
  fillType: 'empty'|'fillSecondary'|'fillPrimary';
}
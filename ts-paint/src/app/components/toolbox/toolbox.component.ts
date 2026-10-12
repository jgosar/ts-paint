import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ALL_DRAWING_TOOL_TYPES, DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';

export interface ToolboxButton {
  tool: DrawingToolType;
  iconClass: string;
}

const TOOLBOX_BUTTONS: ToolboxButton[] = ALL_DRAWING_TOOL_TYPES.map((tool) => ({
  tool,
  iconClass: 'tsp-toolbox__button--' + DrawingToolType[tool] + 'Icon',
}));

@Component({
  selector: 'tsp-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ToolboxComponent {
  readonly buttons: ToolboxButton[] = TOOLBOX_BUTTONS;

  @Input()
  selectedTool: DrawingToolType;
  @Output()
  selectedToolChange: EventEmitter<DrawingToolType> = new EventEmitter<DrawingToolType>();

  selectTool(tool: DrawingToolType) {
    this.selectedToolChange.emit(tool);
  }
}

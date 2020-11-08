import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ALL_DRAWING_TOOL_TYPES, DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';

@Component({
  selector: 'tsp-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolboxComponent {
  availableTools: DrawingToolType[] = ALL_DRAWING_TOOL_TYPES;
  
  @Input()
  selectedTool: DrawingToolType;
  @Output()
  selectedToolChange: EventEmitter<DrawingToolType> = new EventEmitter<DrawingToolType>();

  selectTool(tool: DrawingToolType) {
    this.selectedToolChange.emit(tool);
  }

  getNgClass(tool: DrawingToolType) {
    const ngClass = {};
    ngClass['tsp-toolbox__button--selected'] = this.selectedTool === tool;
    ngClass['tsp-toolbox__button--' + DrawingToolType[tool] + 'Icon'] = true;

    return ngClass;
  }
}

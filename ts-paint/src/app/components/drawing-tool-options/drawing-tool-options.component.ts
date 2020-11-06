import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { DrawingToolOptions } from 'src/app/types/drawing-tools/drawing-tool-options';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';

@Component({
  selector: 'tsp-drawing-tool-options',
  templateUrl: './drawing-tool-options.component.html',
  styleUrls: ['./drawing-tool-options.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingToolOptionsComponent {
  @Input()
  selectedTool: DrawingToolType;
  @Input()
  options: DrawingToolOptions;
  @Output()
  selectedToolChange: EventEmitter<Partial<DrawingToolOptions>> = new EventEmitter<Partial<DrawingToolOptions>>();
}

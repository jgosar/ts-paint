import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { DrawingToolOptions } from 'src/app/types/drawing-tools/drawing-tool-options';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { FillType } from 'src/app/types/drawing-tools/fill-type';

@Component({
  selector: 'tsp-drawing-tool-options',
  templateUrl: './drawing-tool-options.component.html',
  styleUrls: ['./drawing-tool-options.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawingToolOptionsComponent implements OnChanges {
  @Input()
  selectedTool: DrawingToolType;
  @Input()
  options: DrawingToolOptions;
  @Output()
  optionsChange: EventEmitter<Partial<DrawingToolOptions>> = new EventEmitter<Partial<DrawingToolOptions>>();

  displayedPicker: 'fillTypePicker' | undefined = undefined;
  selectedFillType: FillType = undefined;

  ngOnChanges(changes: SimpleChanges): void {
    this.displayedPicker = undefined;
    this.selectedFillType = undefined;

    if([DrawingToolType.rectangle].includes(this.selectedTool)){
      this.displayedPicker = 'fillTypePicker';
      this.selectedFillType = this.options[this.selectedTool].fillType;
    }
  }

  changeSelectedFillType(fillType: FillType){
    const changes: Partial<DrawingToolOptions> = {};

    if([DrawingToolType.rectangle].includes(this.selectedTool)){
      changes[this.selectedTool] = {fillType};
    }

    this.optionsChange.emit(changes);
  }
}

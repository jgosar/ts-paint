import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DrawingToolOptions } from 'src/app/types/drawing-tools/drawing-tool-options';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { BrushShape } from '../../types/drawing-tools/brush-shape';
import { FillType } from 'src/app/types/drawing-tools/fill-type';

@Component({
  selector: 'tsp-drawing-tool-options',
  templateUrl: './drawing-tool-options.component.html',
  styleUrls: ['./drawing-tool-options.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawingToolOptionsComponent implements OnChanges {
  @Input()
  selectedTool: DrawingToolType;
  @Input()
  options: DrawingToolOptions;
  @Output()
  optionsChange: EventEmitter<Partial<DrawingToolOptions>> = new EventEmitter<Partial<DrawingToolOptions>>();

  displayedPicker:
    | 'fillTypePicker'
    | 'lineThicknessPicker'
    | 'eraserSizePicker'
    | 'brushShapePicker'
    | undefined = undefined;
  selectedFillType: FillType = undefined;
  selectedLineThickness: number = undefined;
  selectedEraserSize: number = undefined;
  selectedBrushShape: BrushShape = undefined;

  ngOnChanges(changes: SimpleChanges): void {
    this.displayedPicker = undefined;
    this.selectedFillType = undefined;
    this.selectedLineThickness = undefined;
    this.selectedEraserSize = undefined;
    this.selectedBrushShape = undefined;

    if ([DrawingToolType.rectangle].includes(this.selectedTool)) {
      this.displayedPicker = 'fillTypePicker';
      this.selectedFillType = this.options[DrawingToolType.rectangle].fillType;
    } else if ([DrawingToolType.line].includes(this.selectedTool)) {
      this.displayedPicker = 'lineThicknessPicker';
      this.selectedLineThickness = this.options[DrawingToolType.line].thickness;
    } else if (this.selectedTool === DrawingToolType.eraser) {
      this.displayedPicker = 'eraserSizePicker';
      this.selectedEraserSize = this.options[DrawingToolType.eraser].size;
    } else if (this.selectedTool === DrawingToolType.brush) {
      this.displayedPicker = 'brushShapePicker';
      this.selectedBrushShape = this.options[DrawingToolType.brush].shape;
    }
  }

  changeSelectedLineThickness(thickness: number) {
    const changes: Partial<DrawingToolOptions> = { [DrawingToolType.line]: { thickness } };

    this.optionsChange.emit(changes);
  }

  changeSelectedEraserSize(size: number) {
    const changes: Partial<DrawingToolOptions> = { [DrawingToolType.eraser]: { size } };
    this.optionsChange.emit(changes);
  }

  changeSelectedBrushShape(shape: BrushShape) {
    const changes: Partial<DrawingToolOptions> = { [DrawingToolType.brush]: { shape } };
    this.optionsChange.emit(changes);
  }

  changeSelectedFillType(fillType: FillType) {
    const changes: Partial<DrawingToolOptions> = {};

    if ([DrawingToolType.rectangle].includes(this.selectedTool)) {
      changes[this.selectedTool] = { fillType };
    }

    this.optionsChange.emit(changes);
  }
}

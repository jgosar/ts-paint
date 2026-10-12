import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ALL_LINE_THICKNESSES } from 'src/app/types/drawing-tools/line-thickness';

@Component({
  selector: 'tsp-line-thickness-picker',
  templateUrl: './line-thickness-picker.component.html',
  styleUrls: ['./line-thickness-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LineThicknessPickerComponent {
  readonly thicknesses: number[] = ALL_LINE_THICKNESSES;

  @Input()
  selectedThickness: number;
  @Output()
  selectedThicknessChange: EventEmitter<number> = new EventEmitter<number>();

  selectThickness(thickness: number) {
    this.selectedThicknessChange.emit(thickness);
  }
}

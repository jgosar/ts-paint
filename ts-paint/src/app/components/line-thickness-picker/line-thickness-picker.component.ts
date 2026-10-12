import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ALL_LINE_THICKNESSES } from 'src/app/types/drawing-tools/line-thickness';

const OPTION_HEIGHT: number = 10;

export interface LineThicknessOption {
  thickness: number;
  /** MS Paint leaves the extra pixel of an odd gap below the bar */
  barTop: number;
}

const LINE_THICKNESS_OPTIONS: LineThicknessOption[] = ALL_LINE_THICKNESSES.map((thickness) => ({
  thickness,
  barTop: Math.floor((OPTION_HEIGHT - thickness) / 2),
}));

@Component({
  selector: 'tsp-line-thickness-picker',
  templateUrl: './line-thickness-picker.component.html',
  styleUrls: ['./line-thickness-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LineThicknessPickerComponent {
  readonly options: LineThicknessOption[] = LINE_THICKNESS_OPTIONS;

  @Input()
  selectedThickness: number;
  @Output()
  selectedThicknessChange: EventEmitter<number> = new EventEmitter<number>();

  selectThickness(thickness: number) {
    this.selectedThicknessChange.emit(thickness);
  }
}

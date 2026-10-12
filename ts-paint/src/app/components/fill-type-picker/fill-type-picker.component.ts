import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ALL_FILL_TYPES, FillType } from 'src/app/types/drawing-tools/fill-type';

export interface FillTypeOption {
  fillType: FillType;
  iconClass: string;
}

const FILL_TYPE_OPTIONS: FillTypeOption[] = ALL_FILL_TYPES.map((fillType) => ({
  fillType,
  iconClass: 'tsp-fill-type-picker__option--' + FillType[fillType] + 'Icon',
}));

@Component({
  selector: 'tsp-fill-type-picker',
  templateUrl: './fill-type-picker.component.html',
  styleUrls: ['./fill-type-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FillTypePickerComponent {
  readonly options: FillTypeOption[] = FILL_TYPE_OPTIONS;

  @Input()
  selectedFillType: FillType;
  @Output()
  selectedFillTypeChange: EventEmitter<FillType> = new EventEmitter<FillType>();

  selectFillType(fillType: FillType) {
    this.selectedFillTypeChange.emit(fillType);
  }
}

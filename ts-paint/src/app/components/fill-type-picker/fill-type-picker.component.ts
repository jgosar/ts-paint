import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ALL_FILL_TYPES, FillType } from 'src/app/types/drawing-tools/fill-type';

@Component({
  selector: 'tsp-fill-type-picker',
  templateUrl: './fill-type-picker.component.html',
  styleUrls: ['./fill-type-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FillTypePickerComponent {
  availableFillTypes: FillType[] = ALL_FILL_TYPES;

  @Input()
  selectedFillType: FillType;
  @Output()
  selectedFillTypeChange: EventEmitter<FillType> = new EventEmitter<FillType>();

  selectFillType(fillType: FillType) {
    this.selectedFillTypeChange.emit(fillType);
  }

  getNgClass(fillType: FillType) {
    const ngClass = {};
    ngClass['tsp-fill-type-picker__option--selected'] = this.selectedFillType === fillType;
    ngClass['tsp-fill-type-picker__option--' + FillType[fillType] + 'Icon'] = true;

    return ngClass;
  }
}

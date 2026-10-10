import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ALL_ERASER_SIZES } from 'src/app/types/drawing-tools/eraser-size';

@Component({
  selector: 'tsp-eraser-size-picker',
  templateUrl: './eraser-size-picker.component.html',
  styleUrls: ['./eraser-size-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EraserSizePickerComponent {
  availableSizes: number[] = ALL_ERASER_SIZES;

  @Input()
  selectedSize: number;
  @Output()
  selectedSizeChange: EventEmitter<number> = new EventEmitter<number>();

  selectSize(size: number) {
    this.selectedSizeChange.emit(size);
  }

  getNgClass(size: number) {
    const ngClass = {};
    ngClass['tsp-eraser-size-picker__option--selected'] = this.selectedSize === size;

    return ngClass;
  }
}

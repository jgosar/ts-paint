import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Color } from '../../types/base/color';
import { ColorSelection } from '../../types/base/color-selection';

@Component({
  selector: 'tsp-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaletteComponent {
  @Input()
  selectedPrimaryColor: Color;
  @Input()
  selectedSecondaryColor: Color;
  @Input()
  availableColors: Color[];
  @Output()
  selectedColorChange: EventEmitter<ColorSelection> = new EventEmitter<ColorSelection>();

  selectColor(event: MouseEvent, color: Color) {
    event.preventDefault();
    const primary: boolean = event.button === 0;
    this.selectedColorChange.emit({ color, primary });
  }

  getRgb(color: Color) {
    return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
  }
}

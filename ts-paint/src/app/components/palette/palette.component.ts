import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Color } from '../../types/base/color';
import { ColorSelection } from '../../types/base/color-selection';
import { colorToCss } from '../../helpers/color.helpers';

export interface PaletteSwatch {
  color: Color;
  css: string;
}

@Component({
  selector: 'tsp-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PaletteComponent implements OnChanges {
  @Input()
  selectedPrimaryColor: Color;
  @Input()
  selectedSecondaryColor: Color;
  @Input()
  availableColors: Color[];
  @Output()
  selectedColorChange: EventEmitter<ColorSelection> = new EventEmitter<ColorSelection>();

  swatches: PaletteSwatch[] = [];
  primaryCss: string;
  secondaryCss: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.availableColors) {
      this.swatches = (this.availableColors ?? []).map((color) => ({ color, css: colorToCss(color) }));
    }
    if (changes.selectedPrimaryColor) {
      this.primaryCss = colorToCss(this.selectedPrimaryColor);
    }
    if (changes.selectedSecondaryColor) {
      this.secondaryCss = colorToCss(this.selectedSecondaryColor);
    }
  }

  selectColor(event: MouseEvent, color: Color) {
    event.preventDefault();
    const primary: boolean = event.button === 0;
    this.selectedColorChange.emit({ color, primary });
  }
}

import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
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
export class PaletteComponent {
  readonly selectedPrimaryColor = input.required<Color>();
  readonly selectedSecondaryColor = input.required<Color>();
  readonly availableColors = input.required<Color[]>();
  readonly selectedColorChange = output<ColorSelection>();

  protected readonly swatches = computed<PaletteSwatch[]>(() =>
    this.availableColors().map((color) => ({ color, css: colorToCss(color) }))
  );
  protected readonly primaryCss = computed(() => colorToCss(this.selectedPrimaryColor()));
  protected readonly secondaryCss = computed(() => colorToCss(this.selectedSecondaryColor()));

  selectColor(event: MouseEvent, color: Color) {
    event.preventDefault();
    const primary: boolean = event.button === 0;
    this.selectedColorChange.emit({ color, primary });
  }
}

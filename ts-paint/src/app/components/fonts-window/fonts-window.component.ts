import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { TextOptions } from '../../types/drawing-tools/drawing-tool-options';
import { DropdownOption } from '../../types/base/dropdown-option';
import { Point } from '../../types/base/point';

/** The font sizes MS Paint offers, in points; any other whole size from 1 to 999 can be typed in */
export const FONT_SIZES: number[] = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
export const MAX_FONT_SIZE: number = 999;

/** The value of the family list's last entry, which asks to list every installed font */
export const MORE_FONTS: string = '\u0000more-fonts';

type TextStyle = 'bold' | 'italic' | 'underline';

/** The Fonts toolbar of the text tool: a floating window with the font, its size, and bold, italic and underline */
@Component({
  selector: 'tsp-fonts-window',
  templateUrl: './fonts-window.component.html',
  styleUrls: ['./fonts-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FontsWindowComponent {
  readonly options = input.required<TextOptions>();
  readonly fonts = input.required<string[]>();
  /** Offers "More fonts..." to list every installed font (Local Font Access) */
  readonly canLoadMoreFonts = input<boolean>(false);
  readonly position = input.required<Point>();
  readonly optionsChange = output<Partial<TextOptions>>();
  readonly loadMoreFonts = output<void>();
  readonly positionChange = output<Point>();
  readonly closeClicked = output<void>();

  readonly styles: { key: TextStyle; label: string }[] = [
    { key: 'bold', label: 'Bold' },
    { key: 'italic', label: 'Italic' },
    { key: 'underline', label: 'Underline' },
  ];

  readonly sizeOptions: DropdownOption<number>[] = FONT_SIZES.map((size) => ({ value: size, label: String(size) }));

  readonly familyOptions = computed<DropdownOption<string>[]>(() => {
    const family: string = this.options().fontFamily;
    // The current font stays selectable even when it is not in the list
    const families: string[] = this.fonts().includes(family) ? this.fonts() : [family, ...this.fonts()];
    const options: DropdownOption<string>[] = families.map((font) => ({ value: font, label: font }));
    return this.canLoadMoreFonts() ? [...options, { value: MORE_FONTS, label: 'More fonts...' }] : options;
  });

  readonly parseSize = (text: string): number | undefined => {
    const size: number = Number(text);
    return text !== '' && Number.isInteger(size) && size >= 1 && size <= MAX_FONT_SIZE ? size : undefined;
  };

  changeFamily(family: string) {
    if (family === MORE_FONTS) {
      this.loadMoreFonts.emit();
    } else {
      this.optionsChange.emit({ fontFamily: family });
    }
  }

  changeSize(fontSize: number) {
    this.optionsChange.emit({ fontSize });
  }

  toggle(style: TextStyle) {
    this.optionsChange.emit({ [style]: !this.options()[style] });
  }
}

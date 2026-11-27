import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

export interface DrawOpaqueOption {
  drawOpaque: boolean;
  iconClass: string;
  label: string;
}

const DRAW_OPAQUE_OPTIONS: DrawOpaqueOption[] = [
  { drawOpaque: true, iconClass: 'tsp-draw-opaque-picker__option--opaqueIcon', label: 'Opaque' },
  { drawOpaque: false, iconClass: 'tsp-draw-opaque-picker__option--transparentIcon', label: 'Transparent' },
];

/** The opaque / transparent background choice under the toolbox, shared by the selection and text tools */
@Component({
  selector: 'tsp-draw-opaque-picker',
  templateUrl: './draw-opaque-picker.component.html',
  styleUrls: ['./draw-opaque-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DrawOpaquePickerComponent {
  readonly options: DrawOpaqueOption[] = DRAW_OPAQUE_OPTIONS;

  @Input()
  drawOpaque: boolean;
  @Output()
  drawOpaqueChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  select(drawOpaque: boolean) {
    this.drawOpaqueChange.emit(drawOpaque);
  }
}

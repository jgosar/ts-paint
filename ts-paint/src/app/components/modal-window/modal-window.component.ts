import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'tsp-modal-window',
  templateUrl: './modal-window.component.html',
  styleUrls: ['./modal-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalWindowComponent {
  @Input()
  title: string;
  @Input()
  fullscreen: boolean = false;
}
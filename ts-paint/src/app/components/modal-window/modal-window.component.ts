import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'tsp-modal-window',
  templateUrl: './modal-window.component.html',
  styleUrls: ['./modal-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalWindowComponent implements OnChanges {
  @Input()
  title: string;
  @Input()
  fullscreen: boolean = false;
  @Input()
  icon: 'paint' | undefined;

  iconClass: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.icon === 'paint') {
      this.iconClass = { 'tsp-modal-window__title-bar-icon--paint': true };
    } else {
      this.iconClass = {};
    }
  }
}
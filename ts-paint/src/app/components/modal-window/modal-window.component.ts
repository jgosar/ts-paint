import { Component, ChangeDetectionStrategy, Input, OnChanges, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'tsp-modal-window',
  templateUrl: './modal-window.component.html',
  styleUrls: ['./modal-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWindowComponent implements OnChanges {
  @Input()
  title: string;
  @Input()
  fullscreen: boolean = false;
  @Input()
  closable: boolean = false;
  @Input()
  icon: 'paint' | undefined;
  @Output()
  closeClicked: EventEmitter<void> = new EventEmitter<void>();

  iconClass: any;

  ngOnChanges(): void {
    if (this.icon === 'paint') {
      this.iconClass = { 'tsp-modal-window__title-bar-icon--paint': true };
    } else {
      this.iconClass = {};
    }
  }
}

import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Point } from 'src/app/types/base/point';

@Component({
  selector: 'tsp-attributes-window',
  templateUrl: './attributes-window.component.html',
  styleUrls: ['./attributes-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttributesWindowComponent implements OnChanges {
  @Input()
  image: ImageData;
  @Output()
  saveChanges: EventEmitter<Point> = new EventEmitter<Point>();
  @Output()
  cancel: EventEmitter<void> = new EventEmitter<void>();

  width: number;
  height: number;

  ngOnChanges(changes: SimpleChanges): void {
    this.width = this.image.width;
    this.height = this.image.height;
  }

  okClicked() {
    this.saveChanges.emit({ w: this.width, h: this.height });
  }
}
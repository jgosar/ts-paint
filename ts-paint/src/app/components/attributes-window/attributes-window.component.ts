import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  ViewChild,
  OnInit,
} from '@angular/core';
import { Point } from '../../types/base/point';
import { IntegerInputComponent } from '../inputs/integer-input/integer-input.component';

@Component({
  selector: 'tsp-attributes-window',
  templateUrl: './attributes-window.component.html',
  styleUrls: ['./attributes-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributesWindowComponent implements OnInit, OnChanges {
  @ViewChild('widthInput', { static: true })
  widthInput: IntegerInputComponent;

  @Input()
  image: ImageData;
  @Output()
  saveChanges: EventEmitter<Point> = new EventEmitter<Point>();
  @Output()
  cancel: EventEmitter<void> = new EventEmitter<void>();

  width: number;
  height: number;

  ngOnInit(): void {
    this.widthInput.focus();
  }

  ngOnChanges(): void {
    this.width = this.image.width;
    this.height = this.image.height;
  }

  okClicked() {
    this.saveChanges.emit({ w: this.width, h: this.height });
  }
}

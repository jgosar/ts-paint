import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FlipRotateParams } from 'src/app/types/action-params/flip-rotate-params';
import { FlipRotateWindowAction } from './flip-rotate-window-action';
import { FlipRotateWindowActionOption } from './flip-rotate-window-action-option';
import { IntegerInputComponent } from '../inputs/integer-input/integer-input.component';
import { FlipRotateWindowAngleOption } from './flip-rotate-window-angle-option';

@Component({
  selector: 'tsp-flip-rotate-window',
  templateUrl: './flip-rotate-window.component.html',
  styleUrls: ['./flip-rotate-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlipRotateWindowComponent implements OnInit, OnChanges {
  @ViewChild('angleInput', { static: true })
  angleInput: IntegerInputComponent;

  @Input()
  image: ImageData;
  @Output()
  saveChanges: EventEmitter<FlipRotateParams> = new EventEmitter<FlipRotateParams>();
  @Output()
  cancel: EventEmitter<void> = new EventEmitter<void>();

  actions: FlipRotateWindowActionOption[] = [
    { value: 'horizontal', name: 'Flip horizontal' },
    { value: 'vertical', name: 'Flip vertical' },
    { value: 'rotate', name: 'Rotate by angle' },
  ];

  angles: FlipRotateWindowAngleOption[] = [
    { value: 90, name: '90°' },
    { value: 180, name: '180°' },
    { value: 270, name: '270°' },
  ];

  selectedAngle: FlipRotateWindowAngleOption = this.angles[0];

  get selectedAction(): FlipRotateWindowActionOption {
    return this._selectedAction;
  }
  set selectedAction(value: FlipRotateWindowActionOption) {
    this._selectedAction = value;
    if (value.value === 'rotate') {
      this.angleInput.focus();
    }
  }
  private _selectedAction: FlipRotateWindowActionOption = this.actions[0];

  ngOnInit(): void {}

  ngOnChanges(): void {}

  okClicked() {
    const selectedActionType: FlipRotateWindowAction = this.selectedAction.value;
    if (selectedActionType === 'rotate') {
      this.saveChanges.emit({ rotate: this.selectedAngle.value });
    } else {
      this.saveChanges.emit({ flip: selectedActionType });
    }
  }
}

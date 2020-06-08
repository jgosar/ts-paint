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
import { FlipRotateWindowOption } from './flip-rotate-window-option';
import { IntegerInputComponent } from '../inputs/integer-input/integer-input.component';

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

  actions: FlipRotateWindowOption[] = [
    { value: 'horizontal', name: 'Flip horizontal' },
    { value: 'vertical', name: 'Flip vertical' },
    { value: 'rotate', name: 'Rotate by angle' },
  ];
  angle: number = 90;

  get selectedAction(): FlipRotateWindowOption {
    return this._selectedAction;
  }
  set selectedAction(value: FlipRotateWindowOption) {
    this._selectedAction = value;
    if (value.value === 'rotate') {
      this.angleInput.focus();
    }
  }
  private _selectedAction: FlipRotateWindowOption = this.actions[0];

  ngOnInit(): void {}

  ngOnChanges(): void {}

  okClicked() {
    const selectedActionType: FlipRotateWindowAction = this.selectedAction.value;
    if (selectedActionType === 'rotate') {
      this.saveChanges.emit({ rotate: this.angle });
    } else {
      this.saveChanges.emit({ flip: selectedActionType });
    }
  }
}

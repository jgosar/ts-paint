import {
  Component,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { RadioButtonOption } from './radio-button-option';

@Component({
  selector: 'tsp-radio-button-group',
  templateUrl: './radio-button-group.component.html',
  styleUrls: ['./radio-button-group.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioButtonGroupComponent implements OnChanges {
  @Input()
  options: RadioButtonOption<any>[] = [];
  @Input()
  selectedOption: RadioButtonOption<any>;
  @Input()
  disabled: boolean = false;
  @Output()
  selectedOptionChange: EventEmitter<RadioButtonOption<any>> = new EventEmitter<RadioButtonOption<any>>();

  groupName: string = 'RadioButtonGroup' + Math.floor(Math.random() * 1000000);

  get selectedOptionInternal(): RadioButtonOption<any> {
    return this.selectedOption;
  }

  set selectedOptionInternal(value: RadioButtonOption<any>) {
    this.selectedOptionChange.emit(value);
  }

  ngOnChanges(changes: SimpleChanges): void {}
}

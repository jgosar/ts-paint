import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { validateMinMax } from '../../../helpers/numeric.helpers';

/**
 * A text field that only accepts integers. The text is validated after every edit (the input event), which is the
 * only thing every way of editing has in common: keyboards, virtual keyboards that do not identify their keys
 * (Android), paste, cut, drag and drop and autofill. An edit that would leave an invalid text is reverted.
 */
@Component({
  selector: 'tsp-integer-input',
  templateUrl: './integer-input.component.html',
  styleUrls: ['./integer-input.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class IntegerInputComponent implements OnChanges {
  @ViewChild('inputElement', { static: true })
  inputElement: ElementRef<HTMLInputElement>;

  @Input()
  label: string = '';
  @Input()
  unit: string = '';
  @Input()
  value: number;
  @Input()
  minValue: number = 0;
  @Input()
  maxValue: number = Number.MAX_SAFE_INTEGER;
  @Input()
  disabled: boolean = false;
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>();

  /** The last valid text of the field */
  model: string;

  private _validInputRegex: RegExp = new RegExp(`^(\\d+)?$`);
  private _inputValidators: ((value: string) => boolean)[] = [
    this.validateRegex.bind(this),
    this.validateMinMax.bind(this),
  ];
  private _isModelLocked: boolean = false;
  private _selectionBeforeEdit: [number, number] = [0, 0];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value && !this._isModelLocked) {
      this.model = this.value + '';
    }
  }

  onBeforeInput() {
    // Remembered so that the caret can be put back where it was if the edit has to be reverted
    const input: HTMLInputElement = this.inputElement.nativeElement;
    this._selectionBeforeEdit = [input.selectionStart, input.selectionEnd];
  }

  onInput() {
    const input: HTMLInputElement = this.inputElement.nativeElement;
    if (this.isInputValid(input.value)) {
      this.model = input.value;
      this._isModelLocked = true;
      this.valueChange.emit(Number(input.value));
    } else {
      input.value = this.model;
      input.setSelectionRange(this._selectionBeforeEdit[0], this._selectionBeforeEdit[1]);
    }
  }

  focus() {
    setTimeout(() => {
      this.inputElement.nativeElement.select();
    });
  }

  private isInputValid(value: string): boolean {
    return this._inputValidators.every((v) => v(value));
  }

  private validateRegex(value: string): boolean {
    return this._validInputRegex.test(value);
  }

  private validateMinMax(value: string): boolean {
    return validateMinMax(Number(value), this.minValue, this.maxValue);
  }
}

import { Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { simulateTextChange } from '../../../helpers/text-input.helpers';
import { validateMinMax } from '../../../helpers/numeric.helpers';

@Component({
  selector: 'tsp-integer-input',
  templateUrl: './integer-input.component.html',
  styleUrls: ['./integer-input.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IntegerInputComponent implements OnChanges {
  @ViewChild('inputElement', { static: true })
  inputElement: ElementRef;

  @Input()
  label: string = '';
  @Input()
  value: number;
  @Input()
  minValue: number = 0;
  @Input()
  maxValue: number = Number.MAX_SAFE_INTEGER;
  @Output()
  valueChange: EventEmitter<number> = new EventEmitter<number>();

  model: string;

  private validInputRegex: RegExp = new RegExp(`^(\\d+)?$`);
  private inputValidators: ((value: string) => boolean)[] = [
    this.validateRegex.bind(this),
    this.validateMinMax.bind(this),
  ];
  private isModelLocked: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value && !this.isModelLocked) {
      this.model = this.value + '';
    }
  }

  onKeydown(event: KeyboardEvent) {
    this.processInputEvent(event);
  }

  onPaste(event: ClipboardEvent) {
    this.processInputEvent(event);
  }

  focus() {
    setTimeout(() => {
      this.inputElement.nativeElement.select();
    });
  }

  private processInputEvent(event: KeyboardEvent | ClipboardEvent) {
    const nextModel: string = simulateTextChange(this.model, event);

    if (this.isInputValid(nextModel)) {
      this.isModelLocked = true;
      this.valueChange.emit(parseInt(nextModel));
    } else {
      event.preventDefault();
    }
    event.stopPropagation();
  }

  private isInputValid(value: string): boolean {
    return this.inputValidators.every(v => v(value));
  }

  private validateRegex(value: string): boolean {
    return this.validInputRegex.test(value);
  }

  private validateMinMax(value: string): boolean {
    return validateMinMax(
      parseInt(value),
      this.minValue,
      this.maxValue
    );
  }
}
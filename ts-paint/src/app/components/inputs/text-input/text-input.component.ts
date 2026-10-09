import { Component, ChangeDetectionStrategy, ElementRef, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'tsp-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TextInputComponent {
  readonly value = input.required<string>();
  readonly valueChange = output<string>();

  private readonly _inputElement = viewChild<ElementRef<HTMLInputElement>>('inputElement');

  onInput(event: Event) {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  focus() {
    setTimeout(() => this._inputElement()?.nativeElement.select());
  }
}

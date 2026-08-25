import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';
import { DropdownOption } from '../../../types/base/dropdown-option';

@Component({
  selector: 'tsp-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DropdownComponent<T> {
  readonly value = input.required<T>();
  readonly options = input.required<DropdownOption<T>[]>();
  readonly valueChange = output<T>();

  isOpen = signal(false);

  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? ''
  );

  toggleOpen() {
    this.isOpen.set(!this.isOpen());
  }

  selectOption(option: DropdownOption<T>) {
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
  }

  close() {
    this.isOpen.set(false);
  }

  closeOnEscape(event: KeyboardEvent) {
    if (this.isOpen()) {
      event.stopPropagation();
    }
    this.isOpen.set(false);
  }
}

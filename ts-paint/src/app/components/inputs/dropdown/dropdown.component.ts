import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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

  private readonly _wrapper = viewChild.required<ElementRef<HTMLElement>>('wrapper');

  isOpen = signal(false);

  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? ''
  );

  toggleOpen() {
    this.isOpen.set(!this.isOpen());
    // Keep focus on the wrapper (not on the arrow button), so keyboard handling and focusout work consistently
    this._wrapper().nativeElement.focus();
  }

  selectOption(option: DropdownOption<T>) {
    this.valueChange.emit(option.value);
    this.isOpen.set(false);
  }

  close() {
    this.isOpen.set(false);
  }

  onFocusOut(event: FocusEvent) {
    const newFocusTarget: Node | null = event.relatedTarget as Node | null;
    if (!this._wrapper().nativeElement.contains(newFocusTarget)) {
      this.close();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        this.toggleOpen();
        break;
      case 'ArrowDown':
        this.selectAdjacentOption(1);
        break;
      case 'ArrowUp':
        this.selectAdjacentOption(-1);
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  closeOnEscape(event: KeyboardEvent) {
    if (this.isOpen()) {
      event.stopPropagation();
    }
    this.isOpen.set(false);
  }

  private selectAdjacentOption(offset: number) {
    const options: DropdownOption<T>[] = this.options();
    const currentIndex: number = options.findIndex((option) => option.value === this.value());
    const newIndex: number = Math.min(Math.max(currentIndex + offset, 0), options.length - 1);
    if (newIndex !== currentIndex) {
      this.valueChange.emit(options[newIndex].value);
    }
  }
}

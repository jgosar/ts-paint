import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterRenderEffect,
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
  /** An editable combo box: the field is a text input, and typed text becomes a value through `parseValue` */
  readonly editable = input<boolean>(false);
  /** Turns typed text into a value, or undefined when the text is not valid (only used when editable) */
  readonly parseValue = input<(text: string) => T | undefined>(() => undefined);
  readonly valueChange = output<T>();

  private readonly _wrapper = viewChild.required<ElementRef<HTMLElement>>('wrapper');
  private readonly _list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly _textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');

  isOpen = signal(false);

  /** The label of the selected option; an editable dropdown shows a value without an option as it is */
  protected readonly selectedLabel = computed(() => {
    const label: string | undefined = this.options().find((option) => option.value === this.value())?.label;
    return label ?? (this.editable() && this.value() !== undefined ? String(this.value()) : '');
  });

  constructor() {
    // A long list opens scrolled to the selected option
    afterRenderEffect(() => {
      if (this.isOpen()) {
        this.value();
        this.scrollSelectedOptionIntoView();
      }
    });
  }

  toggleOpen() {
    this.isOpen.set(!this.isOpen());
    // Keep focus inside the dropdown (not on the arrow button), so keyboard handling and focusout work consistently
    this.focusField();
  }

  /** A click on the field opens the list, except on the text of an editable dropdown, where it places the caret */
  onFieldClick(event: MouseEvent) {
    if (!this.editable() || event.target !== this._textInput()?.nativeElement) {
      this.toggleOpen();
    }
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
      if (this.editable()) {
        this.commitText();
      }
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.handleKey(event) && !this.editable()) {
      return;
    }
    // An editable dropdown is a text field: none of its keys reach the app's shortcuts
    event.stopPropagation();
  }

  closeOnEscape(event: KeyboardEvent) {
    if (this.isOpen()) {
      event.stopPropagation();
    }
    this.isOpen.set(false);
  }

  /** Handles the key and returns true if it was one of the dropdown's own keys */
  private handleKey(event: KeyboardEvent): boolean {
    const editable: boolean = this.editable();
    switch (event.key) {
      case 'Enter':
        if (editable) {
          this.commitText();
          this.close();
        } else {
          this.toggleOpen();
        }
        break;
      case ' ':
        if (editable) {
          return false;
        }
        this.toggleOpen();
        break;
      case 'ArrowDown':
        this.selectOptionAt(this.selectedIndex() + 1);
        break;
      case 'ArrowUp':
        this.selectOptionAt(this.selectedIndex() - 1);
        break;
      case 'Home':
      case 'End':
        if (editable) {
          return false;
        }
        this.selectOptionAt(event.key === 'Home' ? 0 : this.options().length - 1);
        break;
      default:
        if (editable || !this.selectByFirstLetter(event)) {
          return false;
        }
    }
    event.preventDefault();
    return true;
  }

  /** Type-ahead: a letter selects the next option that starts with it */
  private selectByFirstLetter(event: KeyboardEvent): boolean {
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }
    const options: DropdownOption<T>[] = this.options();
    const letter: string = event.key.toLocaleLowerCase();
    const start: number = this.selectedIndex();
    for (let step = 1; step <= options.length; step++) {
      const index: number = (start + step + options.length) % options.length;
      if (options[index].label.toLocaleLowerCase().startsWith(letter)) {
        this.selectOptionAt(index);
        return true;
      }
    }
    return false;
  }

  private selectedIndex(): number {
    return this.options().findIndex((option) => option.value === this.value());
  }

  private selectOptionAt(index: number) {
    const options: DropdownOption<T>[] = this.options();
    const newIndex: number = Math.min(Math.max(index, 0), options.length - 1);
    if (newIndex !== this.selectedIndex() && newIndex >= 0) {
      this.valueChange.emit(options[newIndex].value);
    }
  }

  /** Turns the typed text into a value; invalid text is replaced by the current value again */
  private commitText() {
    const textInput: HTMLInputElement | undefined = this._textInput()?.nativeElement;
    if (textInput === undefined) {
      return;
    }
    const parsed: T | undefined = this.parseValue()(textInput.value.trim());
    if (parsed !== undefined && parsed !== this.value()) {
      this.valueChange.emit(parsed);
    } else {
      textInput.value = this.selectedLabel();
    }
  }

  private focusField() {
    (this._textInput() ?? this._wrapper()).nativeElement.focus();
  }

  private scrollSelectedOptionIntoView() {
    const list: HTMLElement | undefined = this._list()?.nativeElement;
    const selected: HTMLElement | null = list?.querySelector('.tsp-dropdown__option--selected');
    if (!selected) {
      return;
    }
    if (selected.offsetTop < list.scrollTop) {
      list.scrollTop = selected.offsetTop;
    } else if (selected.offsetTop + selected.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = selected.offsetTop + selected.offsetHeight - list.clientHeight;
    }
  }
}

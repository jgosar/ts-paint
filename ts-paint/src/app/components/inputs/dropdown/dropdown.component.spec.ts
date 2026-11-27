import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownComponent } from './dropdown.component';
import { DropdownOption } from '../../../types/base/dropdown-option';
import { keydown, keyup, recordEvents, EventRecorder, KeyEventOptions } from '../../../../testing/events';

type Format = 'png' | 'jpeg' | 'gif';

const OPTIONS: DropdownOption<Format>[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'gif', label: 'GIF' },
];

describe('DropdownComponent', () => {
  let fixture: ComponentFixture<DropdownComponent<Format>>;
  let component: DropdownComponent<Format>;
  let emitted: Format[];
  let recorder: EventRecorder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [DropdownComponent] }).compileComponents();
    fixture = TestBed.createComponent<DropdownComponent<Format>>(DropdownComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.valueChange.subscribe((value) => emitted.push(value));
  });

  afterEach(() => recorder?.stop());

  function render(value: Format, options: DropdownOption<Format>[] = OPTIONS) {
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  }

  function wrapper(): HTMLElement {
    return fixture.nativeElement.querySelector('.tsp-dropdown');
  }

  function field(): HTMLElement {
    return fixture.nativeElement.querySelector('.tsp-dropdown__input');
  }

  function clickField() {
    fixture.nativeElement.querySelector('.tsp-depressed-item-container').click();
    fixture.detectChanges();
  }

  function listbox(): HTMLElement | null {
    return fixture.nativeElement.querySelector('[role="listbox"]');
  }

  function optionElements(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  }

  function pressKey(key: string, options: KeyEventOptions = {}): KeyboardEvent {
    const event: KeyboardEvent = keydown(key, options);
    wrapper().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  it('shows the label of the selected value', () => {
    render('jpeg');
    expect(field().textContent.trim()).toBe('JPEG');
  });

  it('shows nothing when no option matches the value', () => {
    render('bmp' as Format);
    expect(field().textContent.trim()).toBe('');
  });

  it('is closed initially and exposes combobox ARIA attributes', () => {
    render('png');
    expect(listbox()).toBeNull();
    expect(wrapper().getAttribute('role')).toBe('combobox');
    expect(wrapper().getAttribute('aria-haspopup')).toBe('listbox');
    expect(wrapper().getAttribute('aria-expanded')).toBe('false');
    expect(wrapper().getAttribute('tabindex')).toBe('0');
  });

  it('opens on click, listing the options and focusing the wrapper, and closes on the next click', () => {
    render('png');
    clickField();
    expect(listbox()).not.toBeNull();
    expect(optionElements().map((o) => o.textContent.trim())).toEqual(['PNG', 'JPEG', 'GIF']);
    expect(wrapper().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(wrapper());
    clickField();
    expect(listbox()).toBeNull();
    expect(wrapper().getAttribute('aria-expanded')).toBe('false');
  });

  it('marks only the selected option as selected', () => {
    render('jpeg');
    clickField();
    expect(optionElements().map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(optionElements().map((o) => o.classList.contains('tsp-dropdown__option--selected'))).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('emits the clicked option and closes; the shown label follows the value input, not the click', () => {
    render('png');
    clickField();
    optionElements()[2].click();
    fixture.detectChanges();
    expect(emitted).toEqual(['gif']);
    expect(listbox()).toBeNull();
    expect(field().textContent.trim(), 'value is controlled by the parent').toBe('PNG');
    fixture.componentRef.setInput('value', 'gif');
    fixture.detectChanges();
    expect(field().textContent.trim()).toBe('GIF');
  });

  describe('keyboard', () => {
    it('toggles with Enter and Space, consuming the key', () => {
      render('png');
      recorder = recordEvents(document, 'keydown');
      const enter: KeyboardEvent = pressKey('Enter');
      expect(listbox()).not.toBeNull();
      expect(enter.defaultPrevented).toBe(true);
      const space: KeyboardEvent = pressKey(' ');
      expect(listbox()).toBeNull();
      expect(space.defaultPrevented).toBe(true);
      expect(recorder.events.length).toBe(0);
    });

    it('moves to the adjacent option with ArrowDown / ArrowUp', () => {
      render('jpeg');
      expect(pressKey('ArrowDown').defaultPrevented).toBe(true);
      expect(emitted).toEqual(['gif']);
      expect(pressKey('ArrowUp').defaultPrevented).toBe(true);
      expect(emitted).toEqual(['gif', 'png']);
    });

    it('clamps the arrows at the ends and only emits on a change', () => {
      render('gif');
      pressKey('ArrowDown');
      expect(emitted).toEqual([]);
      render('png');
      pressKey('ArrowUp');
      expect(emitted).toEqual([]);
    });

    it('does not consume other keys', () => {
      render('png');
      recorder = recordEvents(document, 'keydown');
      const event: KeyboardEvent = pressKey('a');
      expect(event.defaultPrevented).toBe(false);
      expect(recorder.events.length).toBe(1);
      expect(listbox()).toBeNull();
    });

    it('closes on Escape and stops it from propagating only when it was open', () => {
      render('png');
      recorder = recordEvents(document, 'keyup');
      wrapper().dispatchEvent(keyup('Escape'));
      fixture.detectChanges();
      expect(recorder.events.length, 'closed dropdown lets Escape through (so the window can cancel)').toBe(1);

      clickField();
      wrapper().dispatchEvent(keyup('Escape'));
      fixture.detectChanges();
      expect(listbox()).toBeNull();
      expect(recorder.events.length, 'open dropdown consumes Escape').toBe(1);
    });

    it('never lets Enter keyup propagate (toggling must not trigger the window OK)', () => {
      render('png');
      recorder = recordEvents(document, 'keyup');
      wrapper().dispatchEvent(keyup('Enter'));
      expect(recorder.events.length).toBe(0);
    });
  });

  describe('long lists', () => {
    const LETTERS: DropdownOption<Format>[] = ['Alpha', 'Bravo', 'Beta', 'Charlie', 'Delta', 'Echo'].map((label) => ({
      value: label.toLowerCase() as Format,
      label,
    }));

    it('jumps to the first and last option with Home and End', () => {
      render('bravo' as Format, LETTERS);
      expect(pressKey('End').defaultPrevented).toBe(true);
      pressKey('Home');
      expect(emitted).toEqual(['echo', 'alpha']);
    });

    it('selects the next option starting with a typed letter, cycling through them', () => {
      render('alpha' as Format, LETTERS);
      recorder = recordEvents(document, 'keydown');
      pressKey('b');
      render('bravo' as Format, LETTERS);
      pressKey('B');
      render('beta' as Format, LETTERS);
      pressKey('b');
      expect(emitted).toEqual(['bravo', 'beta', 'bravo']);
      expect(recorder.events.length, 'the letters are consumed').toBe(0);
      expect(pressKey('b', { ctrl: true }).defaultPrevented, 'not with Ctrl').toBe(false);
    });

    it('scrolls the open list to the selected option', () => {
      const many: DropdownOption<Format>[] = Array.from({ length: 40 }, (_, index) => ({
        value: ('font' + index) as Format,
        label: 'Font ' + index,
      }));
      render('font35' as Format, many);
      clickField();
      fixture.detectChanges();
      const list: HTMLElement = listbox();
      const selected: HTMLElement = optionElements()[35];
      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      expect(selected.offsetTop).toBeGreaterThanOrEqual(list.scrollTop);
      expect(selected.offsetTop + selected.offsetHeight).toBeLessThanOrEqual(list.scrollTop + list.clientHeight);
      expect(selected.classList).toContain('tsp-dropdown__option--selected');
    });
  });

  describe('editable', () => {
    let numberFixture: ComponentFixture<DropdownComponent<number>>;
    let numbers: number[];
    const SIZES: DropdownOption<number>[] = [8, 10, 12].map((size) => ({ value: size, label: String(size) }));
    const parse = (text: string): number | undefined => (/^\d+$/.test(text) ? Number(text) : undefined);

    beforeEach(() => {
      numberFixture = TestBed.createComponent<DropdownComponent<number>>(DropdownComponent);
      numbers = [];
      numberFixture.componentInstance.valueChange.subscribe((value) => numbers.push(value));
      numberFixture.componentRef.setInput('options', SIZES);
      numberFixture.componentRef.setInput('editable', true);
      numberFixture.componentRef.setInput('parseValue', parse);
      setValue(10);
    });

    function setValue(value: number) {
      numberFixture.componentRef.setInput('value', value);
      numberFixture.detectChanges();
    }

    function textField(): HTMLInputElement {
      return numberFixture.nativeElement.querySelector('input.tsp-dropdown__text');
    }

    function type(text: string, key: string = 'Enter'): KeyboardEvent {
      textField().value = text;
      const event: KeyboardEvent = keydown(key);
      textField().dispatchEvent(event);
      numberFixture.detectChanges();
      return event;
    }

    it('shows the value in a text field, even one that is not an option', () => {
      expect(textField().value).toBe('10');
      setValue(13);
      expect(textField().value).toBe('13');
      const wrapper: HTMLElement = numberFixture.nativeElement.querySelector('.tsp-dropdown');
      expect(wrapper.getAttribute('tabindex')).toBe('-1');
    });

    it('emits typed values on Enter and puts invalid text back', () => {
      type('13');
      expect(numbers).toEqual([13]);
      type('abc');
      expect(numbers).toEqual([13]);
      expect(textField().value).toBe('10');
      type('10');
      expect(numbers, 'nothing changed').toEqual([13]);
    });

    it('emits the typed value when the focus leaves it', () => {
      textField().value = '24';
      numberFixture.nativeElement
        .querySelector('.tsp-dropdown')
        .dispatchEvent(new FocusEvent('focusout', { relatedTarget: null, bubbles: true }));
      expect(numbers).toEqual([24]);
    });

    it('types spaces and letters instead of opening the list, and keeps every key from the app', () => {
      recorder = recordEvents(document, 'keydown');
      expect(type('1', ' ').defaultPrevented).toBe(false);
      expect(type('1', 'Home').defaultPrevented).toBe(false);
      expect(type('1', 'b').defaultPrevented).toBe(false);
      expect(numberFixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
      expect(recorder.events.length).toBe(0);
      expect(numbers).toEqual([]);
    });

    it('still steps through the options with the arrows', () => {
      textField().dispatchEvent(keydown('ArrowDown'));
      expect(numbers).toEqual([12]);
    });

    it('opens the list from the arrow button but not from a click on the text', () => {
      textField().click();
      numberFixture.detectChanges();
      expect(numberFixture.nativeElement.querySelector('[role="listbox"]')).toBeNull();
      (numberFixture.nativeElement.querySelector('.tsp-dropdown__arrow') as HTMLElement).click();
      numberFixture.detectChanges();
      expect(numberFixture.nativeElement.querySelector('[role="listbox"]')).not.toBeNull();
      expect(document.activeElement).toBe(textField());
    });
  });

  describe('focus', () => {
    it('closes when focus leaves the dropdown', () => {
      render('png');
      clickField();
      const outside: HTMLButtonElement = document.createElement('button');
      document.body.appendChild(outside);
      try {
        wrapper().dispatchEvent(new FocusEvent('focusout', { relatedTarget: outside, bubbles: true }));
        fixture.detectChanges();
        expect(listbox()).toBeNull();
      } finally {
        outside.remove();
      }
    });

    it('closes when focus leaves the document', () => {
      render('png');
      clickField();
      wrapper().dispatchEvent(new FocusEvent('focusout', { relatedTarget: null, bubbles: true }));
      fixture.detectChanges();
      expect(listbox()).toBeNull();
    });

    it('stays open when focus moves inside the dropdown', () => {
      render('png');
      clickField();
      const arrow: HTMLElement = fixture.nativeElement.querySelector('.tsp-dropdown__arrow');
      wrapper().dispatchEvent(new FocusEvent('focusout', { relatedTarget: arrow, bubbles: true }));
      fixture.detectChanges();
      expect(listbox()).not.toBeNull();
    });
  });
});

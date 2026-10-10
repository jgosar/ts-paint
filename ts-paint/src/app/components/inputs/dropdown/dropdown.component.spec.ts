import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownComponent } from './dropdown.component';
import { DropdownOption } from '../../../types/base/dropdown-option';
import { keydown, keyup, recordEvents, EventRecorder } from '../../../../testing/events';

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

  function pressKey(key: string): KeyboardEvent {
    const event: KeyboardEvent = keydown(key);
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

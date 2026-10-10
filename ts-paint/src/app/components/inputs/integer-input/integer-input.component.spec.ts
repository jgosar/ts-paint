import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { IntegerInputComponent } from './integer-input.component';
import { afterTimeout, keydown, pasteEventWithText, recordEvents, EventRecorder } from '../../../../testing/events';

describe('IntegerInputComponent', () => {
  let fixture: ComponentFixture<IntegerInputComponent>;
  let component: IntegerInputComponent;
  let input: HTMLInputElement;
  let emitted: number[];
  let reachedDocument: EventRecorder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IntegerInputComponent],
      imports: [FormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(IntegerInputComponent);
    component = fixture.componentInstance;
    input = fixture.nativeElement.querySelector('input');
    emitted = [];
    component.valueChange.subscribe((value) => emitted.push(value));
  });

  afterEach(() => reachedDocument?.stop());

  async function render(value: number, inputs: Record<string, unknown> = {}) {
    fixture.componentRef.setInput('value', value);
    Object.entries(inputs).forEach(([name, inputValue]) => fixture.componentRef.setInput(name, inputValue));
    fixture.detectChanges();
    await fixture.whenStable(); // ngModel writes the model to the input asynchronously
  }

  /** Dispatches a keydown on the input with the caret / selection placed at `selection` (defaults to the end) */
  function pressKey(key: string, selection: [number, number] = [input.value.length, input.value.length]) {
    input.setSelectionRange(selection[0], selection[1]);
    const event: KeyboardEvent = keydown(key);
    input.dispatchEvent(event);
    return event;
  }

  function paste(text: string, selection: [number, number] = [input.value.length, input.value.length]) {
    input.setSelectionRange(selection[0], selection[1]);
    const event: ClipboardEvent = pasteEventWithText(text);
    input.dispatchEvent(event);
    return event;
  }

  it('renders the label, the value and the unit', async () => {
    await render(42, { label: 'Width:', unit: 'px' });
    const labels: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('label'));
    expect(labels.map((l) => l.textContent.trim())).toEqual(['Width:', 'px']);
    expect(input.value).toBe('42');
  });

  it('syncs the model with the value input on changes', async () => {
    await render(5);
    expect(input.value).toBe('5');
    await render(7);
    expect(input.value).toBe('7');
  });

  it('stops syncing the model once the user has edited the field', async () => {
    await render(100);
    pressKey('5');
    expect(emitted).toEqual([1005]);
    await render(7);
    expect(component.model, 'model is locked after the first edit').toBe('100');
    expect(input.value).toBe('100');
  });

  describe('typing', () => {
    it('emits the number that the key would produce at the caret and lets the key through', async () => {
      await render(100);
      const event: KeyboardEvent = pressKey('5');
      expect(emitted).toEqual([1005]);
      expect(event.defaultPrevented).toBe(false);
    });

    it('inserts the key at the caret position', async () => {
      await render(100);
      pressKey('5', [1, 1]);
      expect(emitted).toEqual([1500]);
    });

    it('replaces the selected text', async () => {
      await render(100);
      pressKey('7', [0, 3]);
      expect(emitted).toEqual([7]);
    });

    it('handles Backspace before the caret', async () => {
      await render(100);
      pressKey('Backspace');
      expect(emitted).toEqual([10]);
    });

    it('emits 0 when Delete clears the whole field', async () => {
      // Quirk: an empty field is valid for the regex and Number('') is 0, so clearing the field sets the value to 0
      await render(100);
      pressKey('Delete', [0, 3]);
      expect(emitted).toEqual([0]);
    });

    it('lets navigation keys through without changing the text', async () => {
      await render(100);
      const event: KeyboardEvent = pressKey('ArrowLeft');
      expect(event.defaultPrevented).toBe(false);
      // The unchanged text is still a valid input, so the current value is emitted again
      expect(emitted).toEqual([100]);
    });

    it('prevents keys that would produce a non-numeric text', async () => {
      await render(100);
      expect(pressKey('a').defaultPrevented).toBe(true);
      expect(pressKey('-', [0, 0]).defaultPrevented).toBe(true);
      expect(pressKey('.').defaultPrevented).toBe(true);
      expect(emitted).toEqual([]);
    });

    it('prevents keys that would exceed maxValue', async () => {
      await render(99999, { maxValue: 99999 });
      expect(pressKey('9').defaultPrevented).toBe(true);
      expect(emitted).toEqual([]);
    });

    it('prevents keys that would go below minValue', async () => {
      await render(15, { minValue: 10 });
      expect(pressKey('Backspace').defaultPrevented).toBe(true);
      expect(emitted).toEqual([]);
    });

    it('accepts a key that keeps the value inside the limits', async () => {
      await render(15, { minValue: 10, maxValue: 160 });
      expect(pressKey('9').defaultPrevented).toBe(false);
      expect(emitted).toEqual([159]);
    });

    it('never lets keydown propagate past the input, valid or not', async () => {
      await render(100);
      reachedDocument = recordEvents(document, 'keydown');
      pressKey('5');
      pressKey('a');
      expect(reachedDocument.events.length).toBe(0);
    });
  });

  describe('pasting', () => {
    it('emits the pasted number when it replaces the selection', async () => {
      await render(100);
      const event: ClipboardEvent = paste('42', [0, 3]);
      expect(emitted).toEqual([42]);
      expect(event.defaultPrevented).toBe(false);
    });

    it('inserts the pasted text at the caret', async () => {
      await render(100);
      paste('2', [1, 1]);
      expect(emitted).toEqual([1200]);
    });

    it('prevents pasting non-numeric text', async () => {
      await render(100);
      expect(paste('abc').defaultPrevented).toBe(true);
      expect(paste('1.5').defaultPrevented).toBe(true);
      expect(emitted).toEqual([]);
    });

    it('prevents pasting a number above maxValue', async () => {
      await render(1, { maxValue: 1600 });
      expect(paste('2000', [0, 1]).defaultPrevented).toBe(true);
      expect(emitted).toEqual([]);
    });

    it('does not let paste propagate past the input', async () => {
      await render(100);
      reachedDocument = recordEvents(document, 'paste');
      paste('5');
      paste('x');
      expect(reachedDocument.events.length).toBe(0);
    });
  });

  it('focus() selects the whole text after a timeout', async () => {
    await render(1234);
    component.focus();
    expect(document.activeElement, 'not focused before the timeout').not.toBe(input);
    await afterTimeout();
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(4);
  });

  it('sets the disabled attribute from the disabled input', async () => {
    await render(1);
    expect(input.hasAttribute('disabled')).toBe(false);
    await render(1, { disabled: true });
    expect(input.hasAttribute('disabled')).toBe(true);
  });
});

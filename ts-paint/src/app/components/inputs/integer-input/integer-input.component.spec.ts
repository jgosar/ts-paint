import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegerInputComponent } from './integer-input.component';
import { afterTimeout, keydown, pasteEventWithText, recordEvents, EventRecorder, setInputText } from '../../../../testing/events';

describe('IntegerInputComponent', () => {
  let fixture: ComponentFixture<IntegerInputComponent>;
  let component: IntegerInputComponent;
  let input: HTMLInputElement;
  let emitted: number[];
  let reachedDocument: EventRecorder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [IntegerInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(IntegerInputComponent);
    component = fixture.componentInstance;
    input = fixture.nativeElement.querySelector('input');
    emitted = [];
    component.valueChange.subscribe((value) => emitted.push(value));
  });

  afterEach(() => reachedDocument?.stop());

  function render(value: number, inputs: Record<string, unknown> = {}) {
    fixture.componentRef.setInput('value', value);
    Object.entries(inputs).forEach(([name, inputValue]) => fixture.componentRef.setInput(name, inputValue));
    fixture.detectChanges();
  }

  /**
   * Edits the field the way a browser does: with the caret / selection at `selection` (defaults to the end), the
   * browser fires beforeinput, replaces the selection with `text` and fires input.
   */
  function edit(text: string, selection: [number, number] = [input.value.length, input.value.length]) {
    input.setSelectionRange(selection[0], selection[1]);
    input.dispatchEvent(new InputEvent('beforeinput', { data: text, inputType: 'insertText', bubbles: true }));
    const before: string = input.value;
    setInputText(input, before.substring(0, selection[0]) + text + before.substring(selection[1]));
  }

  it('renders the label, the value and the unit', () => {
    render(42, { label: 'Width:', unit: 'px' });
    const labels: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('label'));
    expect(labels.map((l) => l.textContent.trim())).toEqual(['Width:', 'px']);
    expect(input.value).toBe('42');
  });

  it('asks touch devices for a numeric keyboard', () => {
    expect(input.getAttribute('inputmode')).toBe('numeric');
  });

  it('syncs the field with the value input on changes', () => {
    render(5);
    expect(input.value).toBe('5');
    render(7);
    expect(input.value).toBe('7');
  });

  it('stops syncing the field once the user has edited it', () => {
    render(100);
    edit('5');
    expect(emitted).toEqual([1005]);
    render(7);
    expect(input.value, 'field is locked after the first edit').toBe('1005');
  });

  describe('editing', () => {
    it('emits the number in the field after a valid edit and leaves the text alone', () => {
      render(100);
      edit('5');
      expect(emitted).toEqual([1005]);
      expect(input.value).toBe('1005');
    });

    it('accepts edits in the middle of the text and replacements of a selection', () => {
      render(100);
      edit('5', [1, 1]);
      edit('7', [0, 4]);
      expect(emitted).toEqual([1500, 7]);
    });

    it('emits the value shown in the field even when the keyboard does not identify its keys (Android)', () => {
      // Virtual keyboards send keydown with key 'Unidentified'; only the input event tells what was typed
      render(100);
      input.setSelectionRange(0, 3);
      input.dispatchEvent(keydown('Unidentified'));
      setInputText(input, '5');
      input.dispatchEvent(keydown('Unidentified'));
      setInputText(input, '50');
      expect(emitted).toEqual([5, 50]);
    });

    it('emits 0 when the field is cleared', () => {
      // Quirk: an empty field is valid for the regex and Number('') is 0, so clearing the field sets the value to 0
      render(100);
      edit('', [0, 3]);
      expect(emitted).toEqual([0]);
    });

    it('reverts an edit that would produce a non-numeric text, restoring the caret, and emits nothing', () => {
      render(100);
      edit('a', [1, 1]);
      expect(input.value).toBe('100');
      expect([input.selectionStart, input.selectionEnd]).toEqual([1, 1]);
      edit('-', [0, 0]);
      edit('.', [0, 3]);
      expect(input.value).toBe('100');
      expect([input.selectionStart, input.selectionEnd], 'the replaced selection is restored').toEqual([0, 3]);
      expect(emitted).toEqual([]);
    });

    it('reverts an edit that would exceed maxValue', () => {
      render(99999, { maxValue: 99999 });
      edit('9');
      expect(input.value).toBe('99999');
      expect(emitted).toEqual([]);
    });

    it('reverts an edit that would go below minValue', () => {
      render(15, { minValue: 10 });
      edit('', [1, 2]);
      expect(input.value).toBe('15');
      expect(emitted).toEqual([]);
    });

    it('accepts an edit that keeps the value inside the limits', () => {
      render(15, { minValue: 10, maxValue: 160 });
      edit('9');
      expect(input.value).toBe('159');
      expect(emitted).toEqual([159]);
    });

    it('reverts to the last valid text, not to the bound value', () => {
      render(100);
      edit('5');
      edit('a');
      expect(input.value).toBe('1005');
      expect(emitted).toEqual([1005]);
    });

    it('never lets keydown propagate past the input', () => {
      render(100);
      reachedDocument = recordEvents(document, 'keydown');
      const event: KeyboardEvent = keydown('5');
      input.dispatchEvent(event);
      input.dispatchEvent(keydown('a'));
      expect(reachedDocument.events.length).toBe(0);
      expect(event.defaultPrevented, 'the key itself is let through, the input event validates the result').toBe(false);
    });

    it('does not let paste propagate past the input, nor prevent it', () => {
      render(100);
      reachedDocument = recordEvents(document, 'paste');
      const event: ClipboardEvent = pasteEventWithText('5');
      input.dispatchEvent(event);
      expect(reachedDocument.events.length).toBe(0);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  it('focus() selects the whole text after a timeout', async () => {
    render(1234);
    component.focus();
    expect(document.activeElement, 'not focused before the timeout').not.toBe(input);
    await afterTimeout();
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(4);
  });

  it('sets the disabled attribute from the disabled input', () => {
    render(1);
    expect(input.hasAttribute('disabled')).toBe(false);
    render(1, { disabled: true });
    expect(input.hasAttribute('disabled')).toBe(true);
  });
});

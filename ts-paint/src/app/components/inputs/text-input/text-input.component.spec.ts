import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextInputComponent } from './text-input.component';
import { afterTimeout, keydown, keyup, recordEvents, setInputText, EventRecorder } from '../../../../testing/events';

describe('TextInputComponent', () => {
  let fixture: ComponentFixture<TextInputComponent>;
  let component: TextInputComponent;
  let input: HTMLInputElement;
  let emitted: string[];
  let reachedDocument: EventRecorder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [TextInputComponent] }).compileComponents();
    fixture = TestBed.createComponent(TextInputComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.valueChange.subscribe((value) => emitted.push(value));
    fixture.componentRef.setInput('value', 'picture');
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  afterEach(() => reachedDocument?.stop());

  it('shows the value and follows its changes', () => {
    expect(input.value).toBe('picture');
    fixture.componentRef.setInput('value', 'other');
    fixture.detectChanges();
    expect(input.value).toBe('other');
  });

  it('emits the typed text on input', () => {
    setInputText(input, 'new name');
    expect(emitted).toEqual(['new name']);
  });

  it('focus() selects the whole text after a timeout', async () => {
    component.focus();
    expect(document.activeElement, 'not focused before the timeout').not.toBe(input);
    await afterTimeout();
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('picture'.length);
  });

  it('does not let keydown propagate past the input (Delete / Ctrl+A must not reach the window hotkeys)', () => {
    reachedDocument = recordEvents(document, 'keydown');
    input.dispatchEvent(keydown('Delete'));
    input.dispatchEvent(keydown('a', { ctrl: true }));
    expect(reachedDocument.events.length).toBe(0);
  });

  it('lets keyup propagate so that Enter / Escape still reach the window', () => {
    reachedDocument = recordEvents(document, 'keyup');
    input.dispatchEvent(keyup('Enter'));
    expect(reachedDocument.events.length).toBe(1);
  });
});

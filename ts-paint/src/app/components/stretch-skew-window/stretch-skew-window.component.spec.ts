import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { StretchSkewWindowComponent } from './stretch-skew-window.component';
import { ModalWindowComponent } from '../modal-window/modal-window.component';
import { IntegerInputComponent } from '../inputs/integer-input/integer-input.component';
import { StretchSkewParams } from '../../types/action-params/stretch-skew-params';
import { afterTimeout, keydown, keyup, setInputText } from '../../../testing/events';

describe('StretchSkewWindowComponent', () => {
  let fixture: ComponentFixture<StretchSkewWindowComponent>;
  let component: StretchSkewWindowComponent;
  let saved: StretchSkewParams[];
  let cancelled: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StretchSkewWindowComponent, ModalWindowComponent, IntegerInputComponent],
      imports: [FormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(StretchSkewWindowComponent);
    component = fixture.componentInstance;
    saved = [];
    cancelled = 0;
    component.saveChanges.subscribe((params) => saved.push(params));
    component.cancel.subscribe(() => cancelled++);
    fixture.detectChanges();
    await fixture.whenStable(); // ngModel writes the percentages into the inputs asynchronously
  });

  function inputs(): HTMLInputElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('tsp-integer-input input'));
  }

  function buttonLabelled(label: string): HTMLButtonElement {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent.trim() === label
    );
  }

  function pressKeyAtEnd(input: HTMLInputElement, key: string) {
    input.setSelectionRange(input.value.length, input.value.length);
    const event: KeyboardEvent = keydown(key);
    input.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  it('shows only the Stretch fieldset, with Horizontal and Vertical percentages at 100', () => {
    expect(fixture.nativeElement.querySelector('.tsp-modal-window__title-bar').textContent.trim()).toBe(
      'Stretch and Skew'
    );
    const legends: string[] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('legend')).map((l) =>
      l.textContent.trim()
    );
    expect(legends, 'skew is not implemented and has no controls').toEqual(['Stretch']);
    const labels: string[] = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.tsp-input-label')
    ).map((l) => l.textContent.trim());
    expect(labels).toEqual(['Horizontal:', '%', 'Vertical:', '%']);
    expect(inputs().map((i) => i.value)).toEqual(['100', '100']);
    expect(
      fixture.nativeElement.querySelector('.tsp-stretch-skew-window__big-icon--stretch-horizontal')
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.tsp-stretch-skew-window__big-icon--stretch-vertical')).not.toBeNull();
  });

  it('focuses the horizontal field on init', async () => {
    await afterTimeout();
    expect(document.activeElement).toBe(inputs()[0]);
  });

  it('emits 100% / 100% stretch on OK by default, without skew', () => {
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ stretch: { horizontal: 100, vertical: 100 } }]);
    expect('skew' in saved[0]).toBe(false);
  });

  it('emits the edited percentages', () => {
    pressKeyAtEnd(inputs()[0], '0');
    pressKeyAtEnd(inputs()[1], 'Backspace');
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ stretch: { horizontal: 1000, vertical: 10 } }]);
  });

  it('rejects percentages above 1600', () => {
    setInputText(inputs()[0], '160');
    expect(pressKeyAtEnd(inputs()[0], '0').defaultPrevented).toBe(false);
    setInputText(inputs()[0], '1600');
    expect(pressKeyAtEnd(inputs()[0], '0').defaultPrevented).toBe(true);
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ stretch: { horizontal: 1600, vertical: 100 } }]);
  });

  it('saves on Enter', () => {
    inputs()[0].dispatchEvent(keyup('Enter'));
    expect(saved).toEqual([{ stretch: { horizontal: 100, vertical: 100 } }]);
  });

  it('cancels on Escape, on the Cancel button and on the title bar X', () => {
    inputs()[1].dispatchEvent(keyup('Escape'));
    expect(cancelled).toBe(1);
    buttonLabelled('Cancel').click();
    expect(cancelled).toBe(2);
    fixture.nativeElement.querySelector('.tsp-modal-window__close-button').click();
    expect(cancelled).toBe(3);
    expect(saved).toEqual([]);
  });
});

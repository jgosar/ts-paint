import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { FlipRotateWindowComponent } from './flip-rotate-window.component';
import { ModalWindowComponent } from '../modal-window/modal-window.component';
import { RadioButtonGroupComponent } from '../inputs/radio-button-group/radio-button-group.component';
import { FlipRotateParams } from '../../types/action-params/flip-rotate-params';
import { createImage } from '../../helpers/image.helpers';
import { keyup } from '../../../testing/events';

describe('FlipRotateWindowComponent', () => {
  let fixture: ComponentFixture<FlipRotateWindowComponent>;
  let component: FlipRotateWindowComponent;
  let saved: FlipRotateParams[];
  let cancelled: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlipRotateWindowComponent, ModalWindowComponent, RadioButtonGroupComponent],
      imports: [FormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(FlipRotateWindowComponent);
    component = fixture.componentInstance;
    saved = [];
    cancelled = 0;
    component.saveChanges.subscribe((params) => saved.push(params));
    component.cancel.subscribe(() => cancelled++);
    fixture.componentRef.setInput('image', createImage(10, 10));
    fixture.detectChanges();
    await fixture.whenStable(); // ngModel checks the radios asynchronously
  });

  function groups(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('tsp-radio-button-group'));
  }

  function actionRadios(): HTMLInputElement[] {
    return Array.from(groups()[0].querySelectorAll('input'));
  }

  function angleRadios(): HTMLInputElement[] {
    return Array.from(groups()[1].querySelectorAll('input'));
  }

  function labelsOf(group: HTMLElement): string[] {
    return Array.from<HTMLElement>(group.querySelectorAll('label')).map((l) => l.textContent.trim());
  }

  function buttonLabelled(label: string): HTMLButtonElement {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent.trim() === label
    );
  }

  function choose(radio: HTMLInputElement) {
    radio.click();
    fixture.detectChanges();
  }

  it('offers the flip and rotate actions and the three angles', () => {
    expect(fixture.nativeElement.querySelector('.tsp-modal-window__title-bar').textContent.trim()).toBe(
      'Flip and Rotate'
    );
    expect(fixture.nativeElement.querySelector('legend').textContent.trim()).toBe('Flip or rotate');
    expect(labelsOf(groups()[0])).toEqual(['Flip horizontal', 'Flip vertical', 'Rotate by angle']);
    expect(labelsOf(groups()[1])).toEqual(['90°', '180°', '270°']);
  });

  it('defaults to horizontal flip and 90°, with the angles disabled', () => {
    expect(actionRadios().map((r) => r.checked)).toEqual([true, false, false]);
    expect(angleRadios().map((r) => r.checked)).toEqual([true, false, false]);
    expect(angleRadios().every((r) => r.hasAttribute('disabled'))).toBe(true);
  });

  it('emits a horizontal flip on OK by default', () => {
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ flip: 'horizontal' }]);
  });

  it('emits a vertical flip when that action is chosen, keeping the angles disabled', () => {
    choose(actionRadios()[1]);
    expect(angleRadios().every((r) => r.hasAttribute('disabled'))).toBe(true);
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ flip: 'vertical' }]);
  });

  it('enables the angles for "Rotate by angle" and emits the chosen angle', () => {
    choose(actionRadios()[2]);
    expect(angleRadios().some((r) => r.hasAttribute('disabled'))).toBe(false);
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ rotate: 90 }]);
    choose(angleRadios()[2]);
    buttonLabelled('OK').click();
    expect(saved[1]).toEqual({ rotate: 270 });
  });

  it('disables the angles again when switching back to a flip', () => {
    choose(actionRadios()[2]);
    choose(actionRadios()[0]);
    expect(angleRadios().every((r) => r.hasAttribute('disabled'))).toBe(true);
  });

  it('saves on Enter', () => {
    actionRadios()[0].dispatchEvent(keyup('Enter'));
    expect(saved).toEqual([{ flip: 'horizontal' }]);
  });

  it('cancels on Escape, on the Cancel button and on the title bar X', () => {
    actionRadios()[0].dispatchEvent(keyup('Escape'));
    expect(cancelled).toBe(1);
    buttonLabelled('Cancel').click();
    expect(cancelled).toBe(2);
    fixture.nativeElement.querySelector('.tsp-modal-window__close-button').click();
    expect(cancelled).toBe(3);
    expect(saved).toEqual([]);
  });
});

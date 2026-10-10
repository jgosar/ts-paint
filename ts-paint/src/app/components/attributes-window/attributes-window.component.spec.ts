import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AttributesWindowComponent } from './attributes-window.component';
import { ModalWindowComponent } from '../modal-window/modal-window.component';
import { IntegerInputComponent } from '../inputs/integer-input/integer-input.component';
import { Point } from '../../types/base/point';
import { createImage } from '../../helpers/image.helpers';
import { afterTimeout, keydown, keyup } from '../../../testing/events';

// Quirk, left as is: `ngOnChanges` reads `image.width` unguarded, so binding an undefined image throws. The only
// user (TsPaintComponent) always passes `store.state.image`, which is initialised with an image.
describe('AttributesWindowComponent', () => {
  let fixture: ComponentFixture<AttributesWindowComponent>;
  let component: AttributesWindowComponent;
  let saved: Point[];
  let cancelled: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttributesWindowComponent, ModalWindowComponent, IntegerInputComponent],
      imports: [FormsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(AttributesWindowComponent);
    component = fixture.componentInstance;
    saved = [];
    cancelled = 0;
    component.saveChanges.subscribe((dimensions) => saved.push(dimensions));
    component.cancel.subscribe(() => cancelled++);
  });

  async function render(image: ImageData = createImage(300, 200)) {
    fixture.componentRef.setInput('image', image);
    fixture.detectChanges();
    await fixture.whenStable(); // ngModel writes the dimensions into the inputs asynchronously
  }

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

  it('shows the image dimensions in the Width and Height fields', async () => {
    await render();
    expect(fixture.nativeElement.querySelector('.tsp-modal-window__title-bar').textContent.trim()).toBe('Attributes');
    const labels: string[] = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('tsp-integer-input .tsp-input-label:first-child')
    ).map((l) => l.textContent.trim());
    expect(labels).toEqual(['Width:', 'Height:']);
    expect(inputs().map((i) => i.value)).toEqual(['300', '200']);
  });

  it('copies the dimensions of a new image into the fields', async () => {
    await render();
    await render(createImage(40, 30));
    expect(component.width).toBe(40);
    expect(component.height).toBe(30);
    expect(inputs().map((i) => i.value)).toEqual(['40', '30']);
  });

  it('focuses the width field on init', async () => {
    await render();
    await afterTimeout();
    expect(document.activeElement).toBe(inputs()[0]);
  });

  it('emits the current dimensions on OK', async () => {
    await render();
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ w: 300, h: 200 }]);
  });

  it('emits the edited dimensions on OK', async () => {
    await render();
    pressKeyAtEnd(inputs()[0], '5');
    pressKeyAtEnd(inputs()[1], 'Backspace');
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ w: 3005, h: 20 }]);
  });

  it('rejects dimensions above 99999', async () => {
    await render(createImage(99999, 1));
    expect(pressKeyAtEnd(inputs()[0], '9').defaultPrevented).toBe(true);
    buttonLabelled('OK').click();
    expect(saved).toEqual([{ w: 99999, h: 1 }]);
  });

  it('saves on Enter', async () => {
    await render();
    inputs()[0].dispatchEvent(keyup('Enter'));
    expect(saved).toEqual([{ w: 300, h: 200 }]);
  });

  it('cancels on Escape, on the Cancel button and on the title bar X', async () => {
    await render();
    inputs()[1].dispatchEvent(keyup('Escape'));
    expect(cancelled).toBe(1);
    buttonLabelled('Cancel').click();
    expect(cancelled).toBe(2);
    fixture.nativeElement.querySelector('.tsp-modal-window__close-button').click();
    expect(cancelled).toBe(3);
    expect(saved).toEqual([]);
  });
});

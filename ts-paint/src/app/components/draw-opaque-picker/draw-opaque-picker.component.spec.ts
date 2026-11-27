import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawOpaquePickerComponent } from './draw-opaque-picker.component';

describe('DrawOpaquePickerComponent', () => {
  let fixture: ComponentFixture<DrawOpaquePickerComponent>;
  let component: DrawOpaquePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [DrawOpaquePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(DrawOpaquePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('drawOpaque', true);
    fixture.detectChanges();
  });

  function options(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-draw-opaque-picker__option'));
  }

  function selected(): boolean[] {
    return options().map((option) => option.classList.contains('tsp-draw-opaque-picker__option--selected'));
  }

  it('shows the opaque option above the transparent one, each with its icon', () => {
    expect(options().map((option) => option.getAttribute('aria-label'))).toEqual(['Opaque', 'Transparent']);
    expect(options()[0].classList).toContain('tsp-draw-opaque-picker__option--opaqueIcon');
    expect(options()[1].classList).toContain('tsp-draw-opaque-picker__option--transparentIcon');
  });

  it('marks the current choice', () => {
    expect(selected()).toEqual([true, false]);
    expect(options()[0].getAttribute('aria-pressed')).toBe('true');

    fixture.componentRef.setInput('drawOpaque', false);
    fixture.detectChanges();

    expect(selected()).toEqual([false, true]);
  });

  it('emits the clicked choice', () => {
    const emitted: boolean[] = [];
    component.drawOpaqueChange.subscribe((drawOpaque) => emitted.push(drawOpaque));

    options()[1].click();
    options()[0].click();

    expect(emitted).toEqual([false, true]);
  });

  it('lays out two 39x29 options 3px apart, like MS Paint', () => {
    const [first, second] = options().map((option) => option.getBoundingClientRect());
    expect([first.width, first.height, second.width, second.height]).toEqual([39, 29, 39, 29]);
    expect(second.top - first.bottom).toBe(3);
  });
});

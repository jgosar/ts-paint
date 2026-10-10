import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaletteComponent } from './palette.component';
import { Color } from '../../types/base/color';
import { ColorSelection } from '../../types/base/color-selection';
import { BLACK, BLUE, GREEN, RED, WHITE } from '../../../testing/image-test.helpers';

describe('PaletteComponent', () => {
  let fixture: ComponentFixture<PaletteComponent>;
  let component: PaletteComponent;
  const availableColors: Color[] = Array.from({ length: 16 }, (_, i) => ({ r: i * 16, g: 255 - i * 16, b: i }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [PaletteComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaletteComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedPrimaryColor', RED);
    fixture.componentRef.setInput('selectedSecondaryColor', BLUE);
    fixture.componentRef.setInput('availableColors', availableColors);
    fixture.detectChanges();
  });

  function swatches(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-palette__color-button'));
  }

  function samples(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-palette__color-sample'));
  }

  it('renders one swatch per available color with its rgb background', () => {
    expect(swatches().length).toBe(16);
    expect(swatches()[0].style.backgroundColor).toBe('rgb(0, 255, 0)');
    expect(swatches()[15].style.backgroundColor).toBe('rgb(240, 15, 15)');
  });

  it('shows the secondary color behind the primary color sample', () => {
    expect(samples().length).toBe(2);
    expect(samples()[0].style.backgroundColor).toBe('rgb(0, 0, 255)');
    expect(samples()[1].style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('updates the samples when the selected colors change', () => {
    fixture.componentRef.setInput('selectedPrimaryColor', GREEN);
    fixture.componentRef.setInput('selectedSecondaryColor', WHITE);
    fixture.detectChanges();
    expect(samples()[0].style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(samples()[1].style.backgroundColor).toBe('rgb(0, 128, 0)');
  });

  it('formats a color as a css rgb() string', () => {
    expect(component.getRgb(BLACK)).toBe('rgb(0,0,0)');
    expect(component.getRgb({ r: 1, g: 2, b: 3 })).toBe('rgb(1,2,3)');
  });

  it('emits a primary selection on left click and prevents the default action', () => {
    let emitted: ColorSelection;
    component.selectedColorChange.subscribe((selection) => (emitted = selection));
    const event: MouseEvent = new MouseEvent('click', { button: 0, bubbles: true, cancelable: true });

    swatches()[3].dispatchEvent(event);

    expect(emitted).toEqual({ color: availableColors[3], primary: true });
    expect(event.defaultPrevented).toBe(true);
  });

  it('emits a secondary selection on right click (contextmenu) and prevents the context menu', () => {
    let emitted: ColorSelection;
    component.selectedColorChange.subscribe((selection) => (emitted = selection));
    const event: MouseEvent = new MouseEvent('contextmenu', { button: 2, bubbles: true, cancelable: true });

    swatches()[7].dispatchEvent(event);

    expect(emitted).toEqual({ color: availableColors[7], primary: false });
    expect(event.defaultPrevented).toBe(true);
  });
});

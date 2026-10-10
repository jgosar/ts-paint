import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EraserSizePickerComponent } from './eraser-size-picker.component';

describe('EraserSizePickerComponent', () => {
  let fixture: ComponentFixture<EraserSizePickerComponent>;
  let component: EraserSizePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [EraserSizePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(EraserSizePickerComponent);
    component = fixture.componentInstance;
    component.selectedSize = 8;
    fixture.detectChanges();
  });

  function options(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('.tsp-eraser-size-picker__option');
  }

  it('shows the four eraser sizes as squares of 4, 6, 8 and 10 px', () => {
    expect(options().length).toBe(4);
    const squares: HTMLElement[] = Array.from(options()).map((o) => o.querySelector('.tsp-eraser-size-picker__square'));
    expect(squares.map((s) => s.style.width)).toEqual(['4px', '6px', '8px', '10px']);
    expect(squares.map((s) => s.style.height)).toEqual(['4px', '6px', '8px', '10px']);
  });

  it('marks the selected size', () => {
    const selected: HTMLElement[] = Array.from(options()).filter((o) =>
      o.classList.contains('tsp-eraser-size-picker__option--selected')
    );
    expect(selected.length).toBe(1);
    expect(selected[0].querySelector<HTMLElement>('.tsp-eraser-size-picker__square').style.width).toBe('8px');
  });

  it('emits the size of a clicked option', () => {
    let emitted: number;
    component.selectedSizeChange.subscribe((size) => (emitted = size));
    options()[3].click();
    expect(emitted).toBe(10);
  });
});

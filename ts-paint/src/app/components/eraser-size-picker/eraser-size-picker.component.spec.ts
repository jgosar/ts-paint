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
    expect(squares.map((s) => s.getBoundingClientRect().width)).toEqual([4, 6, 8, 10]);
    expect(squares.map((s) => s.getBoundingClientRect().height)).toEqual([4, 6, 8, 10]);
  });

  it('marks the selected size', () => {
    const selected: HTMLElement[] = Array.from(options()).filter((o) =>
      o.classList.contains('tsp-eraser-size-picker__option--selected')
    );
    expect(selected.length).toBe(1);
    expect(selected[0].querySelector('.tsp-eraser-size-picker__square').getBoundingClientRect().width).toBe(8);
  });

  it('emits the size of a clicked option', () => {
    let emitted: number;
    component.selectedSizeChange.subscribe((size) => (emitted = size));
    options()[3].click();
    expect(emitted).toBe(10);
  });

  it('marks the selected size with a 14x14 square centred on the eraser, like MS Paint', () => {
    for (const size of [4, 6, 8, 10]) {
      fixture.componentRef.setInput('selectedSize', size);
      fixture.detectChanges();
      const option: HTMLElement = fixture.nativeElement.querySelector('.tsp-eraser-size-picker__option--selected');
      const optionRect: DOMRect = option.getBoundingClientRect();
      const marker: DOMRect = option.querySelector('.tsp-eraser-size-picker__highlight').getBoundingClientRect();
      const square: DOMRect = option.querySelector('.tsp-eraser-size-picker__square').getBoundingClientRect();
      expect([optionRect.width, optionRect.height], `option ${size}`).toEqual([39, 16]);
      expect(
        [marker.left - optionRect.left, marker.top - optionRect.top, marker.width, marker.height],
        `marker ${size}`
      ).toEqual([13, 1, 14, 14]);
      const offset: number = (14 - size) / 2;
      expect([square.left - marker.left, square.top - marker.top], `square ${size}`).toEqual([offset, offset]);
    }
  });
});

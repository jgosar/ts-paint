import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineThicknessPickerComponent } from './line-thickness-picker.component';

describe('LineThicknessPickerComponent', () => {
  let fixture: ComponentFixture<LineThicknessPickerComponent>;
  let component: LineThicknessPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [LineThicknessPickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(LineThicknessPickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedThickness', 3);
    fixture.detectChanges();
  });

  function options(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-line-thickness-picker__option'));
  }

  function selectedOptions(): HTMLElement[] {
    return options().filter((option) => option.classList.contains('tsp-line-thickness-picker__option--selected'));
  }

  function barHeight(option: HTMLElement): string {
    return option.querySelector<HTMLElement>('.tsp-line-thickness-picker__bar').style.height;
  }

  it('shows the five thicknesses as bars of 1 to 5 px', () => {
    expect(options().length).toBe(5);
    expect(options().map(barHeight)).toEqual(['1px', '2px', '3px', '4px', '5px']);
  });

  it('marks only the selected thickness', () => {
    expect(selectedOptions().length).toBe(1);
    expect(barHeight(selectedOptions()[0])).toBe('3px');
  });

  it('marks nothing when the selected thickness is not one of the options', () => {
    fixture.componentRef.setInput('selectedThickness', 7);
    fixture.detectChanges();
    expect(selectedOptions().length).toBe(0);
  });

  it('emits the thickness of a clicked option', () => {
    const emitted: number[] = [];
    component.selectedThicknessChange.subscribe((thickness) => emitted.push(thickness));

    options()[4].click();
    options()[0].click();

    expect(emitted).toEqual([5, 1]);
  });

  it('lays out 35x10 options with 27 px bars, positioned like MS Paint', () => {
    const tops: number[] = options().map((option) => {
      const optionRect: DOMRect = option.getBoundingClientRect();
      const bar: DOMRect = option.querySelector('.tsp-line-thickness-picker__bar').getBoundingClientRect();
      expect([optionRect.width, optionRect.height]).toEqual([35, 10]);
      expect([bar.left - optionRect.left, bar.width]).toEqual([4, 27]);
      return bar.top - optionRect.top;
    });
    // floor((10 - thickness) / 2): odd thicknesses leave the extra pixel below the bar
    expect(tops).toEqual([4, 4, 3, 3, 2]);
    const optionTops: number[] = options().map((option) => option.getBoundingClientRect().top);
    expect(optionTops.map((top) => top - optionTops[0])).toEqual([0, 12, 24, 36, 48]);
  });
});

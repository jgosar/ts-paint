import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FillTypePickerComponent } from './fill-type-picker.component';
import { FillType } from '../../types/drawing-tools/fill-type';

describe('FillTypePickerComponent', () => {
  let fixture: ComponentFixture<FillTypePickerComponent>;
  let component: FillTypePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [FillTypePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(FillTypePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedFillType', FillType.FILL_SECONDARY);
    fixture.detectChanges();
  });

  function options(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-fill-type-picker__option'));
  }

  function selectedOptions(): HTMLElement[] {
    return options().filter((option) => option.classList.contains('tsp-fill-type-picker__option--selected'));
  }

  it('shows the three fill types in order, each with its icon class', () => {
    const iconClasses: string[] = options().map((option) =>
      Array.from(option.classList).find((c) => c.endsWith('Icon'))
    );
    expect(iconClasses).toEqual([
      'tsp-fill-type-picker__option--EMPTYIcon',
      'tsp-fill-type-picker__option--FILL_SECONDARYIcon',
      'tsp-fill-type-picker__option--FILL_PRIMARYIcon',
    ]);
  });

  it('marks only the selected fill type', () => {
    expect(selectedOptions().length).toBe(1);
    expect(selectedOptions()[0]).toBe(options()[1]);
  });

  it('moves the selected class when the input changes', () => {
    fixture.componentRef.setInput('selectedFillType', FillType.FILL_PRIMARY);
    fixture.detectChanges();
    expect(selectedOptions().length).toBe(1);
    expect(selectedOptions()[0]).toBe(options()[2]);
  });

  it('emits the fill type of a clicked option', () => {
    const emitted: FillType[] = [];
    component.selectedFillTypeChange.subscribe((fillType) => emitted.push(fillType));

    options()[0].click();
    options()[2].click();

    expect(emitted).toEqual([FillType.EMPTY, FillType.FILL_PRIMARY]);
  });
});

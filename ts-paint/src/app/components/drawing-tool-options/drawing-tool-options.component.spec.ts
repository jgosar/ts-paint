import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawingToolOptionsComponent } from './drawing-tool-options.component';
import { FillTypePickerComponent } from '../fill-type-picker/fill-type-picker.component';
import { LineThicknessPickerComponent } from '../line-thickness-picker/line-thickness-picker.component';
import { EraserSizePickerComponent } from '../eraser-size-picker/eraser-size-picker.component';
import { BrushShapePickerComponent } from '../brush-shape-picker/brush-shape-picker.component';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { DrawingToolOptions } from '../../types/drawing-tools/drawing-tool-options';
import { FillType } from '../../types/drawing-tools/fill-type';
import { SimpleChange } from '@angular/core';
import { BrushForm } from '../../types/drawing-tools/brush-shape';

describe('DrawingToolOptionsComponent', () => {
  let fixture: ComponentFixture<DrawingToolOptionsComponent>;
  let component: DrawingToolOptionsComponent;
  const options: DrawingToolOptions = {
    [DrawingToolType.rectangle]: { fillType: FillType.EMPTY },
    [DrawingToolType.line]: { thickness: 4 },
    [DrawingToolType.eraser]: { size: 8 },
    [DrawingToolType.brush]: { shape: { form: BrushForm.ROUND, size: 4 } },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        DrawingToolOptionsComponent,
        FillTypePickerComponent,
        LineThicknessPickerComponent,
        EraserSizePickerComponent,
        BrushShapePickerComponent,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DrawingToolOptionsComponent);
    component = fixture.componentInstance;
  });

  function selectTool(tool: DrawingToolType) {
    component.selectedTool = tool;
    component.options = options;
    component.ngOnChanges({ selectedTool: new SimpleChange(undefined, tool, true) });
    fixture.detectChanges();
  }

  it('shows the line thickness picker for the line tool', () => {
    selectTool(DrawingToolType.line);
    const picker: HTMLElement = fixture.nativeElement.querySelector('tsp-line-thickness-picker');
    expect(picker).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tsp-fill-type-picker')).toBeNull();
    expect(picker.querySelectorAll('.tsp-line-thickness-picker__option').length).toBe(5);
    const selected: HTMLElement = picker.querySelector('.tsp-line-thickness-picker__option--selected');
    const bar: HTMLElement = selected.querySelector('.tsp-line-thickness-picker__bar');
    expect(bar.style.height).toBe('4px');
  });

  it('shows no picker for the pencil tool', () => {
    selectTool(DrawingToolType.pencil);
    expect(fixture.nativeElement.querySelector('tsp-line-thickness-picker')).toBeNull();
    expect(fixture.nativeElement.querySelector('tsp-fill-type-picker')).toBeNull();
  });

  it('shows the fill type picker, not the thickness picker, for the rectangle tool', () => {
    selectTool(DrawingToolType.rectangle);
    expect(fixture.nativeElement.querySelector('tsp-line-thickness-picker')).toBeNull();
    expect(fixture.nativeElement.querySelector('tsp-fill-type-picker')).not.toBeNull();
  });

  it('emits the new thickness under the line tool options when a bar is clicked', () => {
    selectTool(DrawingToolType.line);
    let emitted: Partial<DrawingToolOptions>;
    component.optionsChange.subscribe((changes) => (emitted = changes));

    const bars: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.tsp-line-thickness-picker__option');
    bars[1].click();

    expect(emitted).toEqual({ [DrawingToolType.line]: { thickness: 2 } });
  });

  it('shows the eraser size picker for the eraser tool and emits the clicked size', () => {
    selectTool(DrawingToolType.eraser);
    const picker: HTMLElement = fixture.nativeElement.querySelector('tsp-eraser-size-picker');
    expect(picker).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tsp-brush-shape-picker')).toBeNull();
    expect(picker.querySelectorAll('.tsp-eraser-size-picker__option--selected').length).toBe(1);
    let emitted: Partial<DrawingToolOptions>;
    component.optionsChange.subscribe((changes) => (emitted = changes));

    picker.querySelectorAll<HTMLElement>('.tsp-eraser-size-picker__option')[3].click();

    expect(emitted).toEqual({ [DrawingToolType.eraser]: { size: 10 } });
  });

  it('shows the brush shape picker for the brush tool and emits the clicked shape', () => {
    selectTool(DrawingToolType.brush);
    const picker: HTMLElement = fixture.nativeElement.querySelector('tsp-brush-shape-picker');
    expect(picker).not.toBeNull();
    expect(fixture.nativeElement.querySelector('tsp-eraser-size-picker')).toBeNull();
    expect(picker.querySelectorAll('.tsp-brush-shape-picker__option--selected').length).toBe(1);
    let emitted: Partial<DrawingToolOptions>;
    component.optionsChange.subscribe((changes) => (emitted = changes));

    picker.querySelectorAll<HTMLElement>('.tsp-brush-shape-picker__option')[3].click();

    expect(emitted).toEqual({ [DrawingToolType.brush]: { shape: { form: BrushForm.SQUARE, size: 8 } } });
  });
});

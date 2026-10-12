import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawingToolOptionsComponent } from './drawing-tool-options.component';
import { FillTypePickerComponent } from '../fill-type-picker/fill-type-picker.component';
import { LineThicknessPickerComponent } from '../line-thickness-picker/line-thickness-picker.component';
import { EraserSizePickerComponent } from '../eraser-size-picker/eraser-size-picker.component';
import { BrushShapePickerComponent } from '../brush-shape-picker/brush-shape-picker.component';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { DrawingToolOptions } from '../../types/drawing-tools/drawing-tool-options';
import { ALL_FILL_TYPES, FillType } from '../../types/drawing-tools/fill-type';
import { SimpleChange } from '@angular/core';
import { ALL_BRUSH_SHAPES, BrushForm } from '../../types/drawing-tools/brush-shape';
import { ALL_ERASER_SIZES } from '../../types/drawing-tools/eraser-size';

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
    expect(bar.getBoundingClientRect().height).toBe(4);
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

  describe('every picker state fits inside the sunken frame', () => {
    function showOption(tool: DrawingToolType, toolOptions: DrawingToolOptions[keyof DrawingToolOptions]) {
      component.selectedTool = tool;
      component.options = { ...options, [tool]: toolOptions };
      component.ngOnChanges({ options: new SimpleChange(undefined, component.options, false) });
      fixture.componentRef.changeDetectorRef.markForCheck();
      fixture.detectChanges();
    }

    /** Elements that paint something and lie outside the frame's inner (padding) box */
    function elementsOutsideFrame(): string[] {
      const frame: HTMLElement = fixture.nativeElement.querySelector('.tsp-drawing-tool-options__container');
      const frameRect: DOMRect = frame.getBoundingClientRect();
      const left: number = frameRect.left + frame.clientLeft;
      const top: number = frameRect.top + frame.clientTop;
      const right: number = left + frame.clientWidth;
      const bottom: number = top + frame.clientHeight;
      return Array.from<HTMLElement>(frame.querySelectorAll('div, canvas'))
        .filter((element) => {
          const rect: DOMRect = element.getBoundingClientRect();
          const paints: boolean = rect.width > 0 && rect.height > 0 && getComputedStyle(element).display !== 'none';
          return paints && (rect.left < left || rect.top < top || rect.right > right || rect.bottom > bottom);
        })
        .map((element) => element.className);
    }

    const cases: [string, DrawingToolType, DrawingToolOptions[keyof DrawingToolOptions][]][] = [
      ['fill types', DrawingToolType.rectangle, ALL_FILL_TYPES.map((fillType) => ({ fillType }))],
      ['line thicknesses', DrawingToolType.line, [1, 2, 3, 4, 5].map((thickness) => ({ thickness }))],
      ['eraser sizes', DrawingToolType.eraser, ALL_ERASER_SIZES.map((size) => ({ size }))],
      ['brush shapes', DrawingToolType.brush, ALL_BRUSH_SHAPES.map((shape) => ({ shape }))],
    ];
    for (const [name, tool, values] of cases) {
      it(name, () => {
        for (const value of values) {
          showOption(tool, value);
          expect(elementsOutsideFrame(), JSON.stringify(value)).toEqual([]);
        }
      });
    }
  });
});

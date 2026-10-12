import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrushShapePickerComponent } from './brush-shape-picker.component';
import { ALL_BRUSH_SHAPES, BrushForm, BrushShape } from '../../types/drawing-tools/brush-shape';

describe('BrushShapePickerComponent', () => {
  let fixture: ComponentFixture<BrushShapePickerComponent>;
  let component: BrushShapePickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [BrushShapePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(BrushShapePickerComponent);
    component = fixture.componentInstance;
    component.selectedShape = { form: BrushForm.ROUND, size: 4 };
    fixture.detectChanges();
  });

  function options(): NodeListOf<HTMLElement> {
    return fixture.nativeElement.querySelectorAll('.tsp-brush-shape-picker__option');
  }

  function canvasOf(option: HTMLElement): HTMLCanvasElement {
    return option.querySelector('canvas');
  }

  function pixelAt(canvas: HTMLCanvasElement, w: number, h: number): number[] {
    return Array.from(canvas.getContext('2d').getImageData(w, h, 1, 1).data);
  }

  it('shows the 12 brush shapes in picker order, each drawn on a canvas the size of the brush', () => {
    expect(options().length).toBe(12);
    const sizes: string[] = Array.from(options()).map((o) => `${canvasOf(o).width}x${canvasOf(o).height}`);
    expect(sizes).toEqual(['7x7', '4x4', '1x1', '8x8', '5x5', '2x2', '8x8', '5x5', '2x2', '8x8', '5x5', '2x2']);
  });

  it('draws the large round brush in black with the corners left out', () => {
    const canvas: HTMLCanvasElement = canvasOf(options()[0]);
    expect(pixelAt(canvas, 3, 3)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(canvas, 0, 0)[3]).toBe(0);
    expect(pixelAt(canvas, 2, 0)).toEqual([0, 0, 0, 255]);
  });

  it('marks the selected shape and draws it in white', () => {
    const selected: HTMLElement[] = Array.from(options()).filter((o) =>
      o.classList.contains('tsp-brush-shape-picker__option--selected')
    );
    expect(selected.length).toBe(1);
    expect(selected[0]).toBe(options()[1]);
    expect(pixelAt(canvasOf(selected[0]), 1, 1)).toEqual([255, 255, 255, 255]);
  });

  it('redraws when the selection changes', () => {
    component.selectedShape = { form: BrushForm.SQUARE, size: 8 };
    component.ngOnChanges({});
    fixture.detectChanges();
    expect(pixelAt(canvasOf(options()[1]), 1, 1)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(canvasOf(options()[3]), 0, 0)).toEqual([255, 255, 255, 255]);
  });

  it('emits the shape of a clicked option', () => {
    let emitted: BrushShape;
    component.selectedShapeChange.subscribe((shape) => (emitted = shape));
    options()[9].click();
    expect(emitted).toEqual({ form: BrushForm.BACKWARD_DIAGONAL, size: 8 });
  });

  describe('layout in the 39x64 box', () => {
    /** Position of an element relative to the picker's top-left corner */
    function boxOf(element: Element): { x: number; y: number; width: number; height: number } {
      const origin: DOMRect = fixture.nativeElement.querySelector('.tsp-brush-shape-picker').getBoundingClientRect();
      const rect: DOMRect = element.getBoundingClientRect();
      return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
    }

    it('places every brush where MS Paint draws its icon', () => {
      const positions: [number, number][] = Array.from(options()).map((o) => {
        const box = boxOf(canvasOf(o));
        return [box.x, box.y];
      });
      expect(positions).toEqual([
        [3, 4],
        [17, 6],
        [32, 7],
        [2, 20],
        [17, 21],
        [31, 23],
        [2, 36],
        [17, 37],
        [31, 39],
        [2, 52],
        [17, 53],
        [31, 55],
      ]);
    });

    it('centres the 10x10 selection marker on the selected brush and keeps it 1px inside the box', () => {
      ALL_BRUSH_SHAPES.forEach((shape, index) => {
        fixture.componentRef.setInput('selectedShape', shape);
        fixture.detectChanges();
        const option: HTMLElement = options()[index];
        const marker = boxOf(option.querySelector('.tsp-brush-shape-picker__highlight'));
        const brush = boxOf(canvasOf(option));
        const label: string = `${BrushForm[shape.form]} ${shape.size}`;
        expect([marker.width, marker.height], label).toEqual([10, 10]);
        const leftMargin: number = brush.x - marker.x;
        const rightMargin: number = marker.x + marker.width - (brush.x + brush.width);
        const topMargin: number = brush.y - marker.y;
        const bottomMargin: number = marker.y + marker.height - (brush.y + brush.height);
        expect(Math.min(leftMargin, rightMargin, topMargin, bottomMargin), label).toBeGreaterThanOrEqual(0);
        expect(Math.abs(leftMargin - rightMargin), label).toBeLessThanOrEqual(1);
        expect(Math.abs(topMargin - bottomMargin), label).toBeLessThanOrEqual(1);
        expect(marker.x, label).toBeGreaterThanOrEqual(1);
        expect(marker.x + marker.width, label).toBeLessThanOrEqual(38);
        expect(marker.y, label).toBeGreaterThanOrEqual(1);
        expect(marker.y + marker.height, label).toBeLessThanOrEqual(63);
      });
    });
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrushShapePickerComponent } from './brush-shape-picker.component';
import { BrushForm, BrushShape } from '../../types/drawing-tools/brush-shape';

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
    expect(sizes).toEqual(['7x7', '4x4', '1x1', '8x8', '5x5', '2x2', '9x9', '5x5', '3x3', '9x9', '5x5', '3x3']);
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
    expect(emitted).toEqual({ form: BrushForm.BACKWARD_DIAGONAL, size: 9 });
  });
});

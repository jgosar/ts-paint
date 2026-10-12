import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  ElementRef,
  OnChanges,
  AfterViewInit,
  SimpleChanges,
} from '@angular/core';
import { ALL_BRUSH_SHAPES, BrushShape, brushShapesEqual } from 'src/app/types/drawing-tools/brush-shape';
import { createBrushForShape } from 'src/app/helpers/brush.helpers';
import { Brush } from 'src/app/types/base/brush';
import { Color } from 'src/app/types/base/color';

const COLOR_BLACK: Color = { r: 0, g: 0, b: 0 };

@Component({
  selector: 'tsp-brush-shape-picker',
  templateUrl: './brush-shape-picker.component.html',
  styleUrls: ['./brush-shape-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BrushShapePickerComponent implements OnChanges, AfterViewInit {
  readonly shapes: BrushShape[] = ALL_BRUSH_SHAPES;

  @Input()
  selectedShape: BrushShape;
  @Output()
  selectedShapeChange: EventEmitter<BrushShape> = new EventEmitter<BrushShape>();

  selectedIndex: number = -1;

  @ViewChildren('brushCanvas')
  private _canvases: QueryList<ElementRef<HTMLCanvasElement>>;

  ngOnChanges(changes: SimpleChanges): void {
    this.selectedIndex = this.shapes.findIndex((shape) => brushShapesEqual(shape, this.selectedShape));
  }

  ngAfterViewInit(): void {
    this.drawBrushes();
  }

  selectShape(shape: BrushShape) {
    this.selectedShapeChange.emit(shape);
  }

  /** Draws every brush the way the tool paints it, in black; the stylesheet shows the selected one in white */
  private drawBrushes() {
    this._canvases.forEach((canvasRef, index) => {
      const brush: Brush = createBrushForShape(this.shapes[index], COLOR_BLACK);
      canvasRef.nativeElement.getContext('2d').putImageData(this.brushToImageData(brush), 0, 0);
    });
  }

  private brushToImageData(brush: Brush): ImageData {
    const size: number = brush.pixels.length;
    const imageData: ImageData = new ImageData(size, size);
    brush.pixels.forEach((row, h) =>
      row.forEach((color, w) => {
        if (color !== null) {
          imageData.data.set([color.r, color.g, color.b, 255], 4 * (w + size * h));
        }
      })
    );
    return imageData;
  }
}

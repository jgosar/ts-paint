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
import { Point } from 'src/app/types/base/point';
import { COLOR_WHITE } from 'src/app/services/ts-paint/ts-paint.config';

const COLOR_BLACK: Color = { r: 0, g: 0, b: 0 };

/** Where each brush is drawn inside its 13x16 cell, as measured in MS Paint (picker order) */
const BRUSH_OFFSETS_IN_CELL: Point[] = [
  { w: 3, h: 4 },
  { w: 4, h: 6 },
  { w: 6, h: 7 },
  { w: 2, h: 4 },
  { w: 4, h: 5 },
  { w: 5, h: 7 },
  { w: 2, h: 4 },
  { w: 4, h: 5 },
  { w: 5, h: 7 },
  { w: 2, h: 4 },
  { w: 4, h: 5 },
  { w: 5, h: 7 },
];
const CELL_WIDTH: number = 13;
const CELL_HEIGHT: number = 16;
/**
 * MS Paint marks the selection with a narrow bar; a square looks better. It is centred on the brush, an odd leftover
 * pixel going right and down, which keeps every marker at least 1px inside the frame.
 */
const HIGHLIGHT_SIZE: number = 10;

export interface BrushShapePickerOption {
  shape: BrushShape;
  cell: Point;
  highlight: Point;
  brush: Point;
}

function centreHighlightOn(brush: Point, size: number): Point {
  const margin: number = Math.floor((HIGHLIGHT_SIZE - size) / 2);
  return { w: brush.w - margin, h: brush.h - margin };
}

@Component({
  selector: 'tsp-brush-shape-picker',
  templateUrl: './brush-shape-picker.component.html',
  styleUrls: ['./brush-shape-picker.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BrushShapePickerComponent implements OnChanges, AfterViewInit {
  options: BrushShapePickerOption[] = ALL_BRUSH_SHAPES.map((shape, index) => {
    const column: number = index % 3;
    const row: number = Math.floor(index / 3);
    return {
      shape,
      cell: { w: column * CELL_WIDTH, h: row * CELL_HEIGHT },
      highlight: centreHighlightOn(BRUSH_OFFSETS_IN_CELL[index], shape.size),
      brush: BRUSH_OFFSETS_IN_CELL[index],
    };
  });

  @Input()
  selectedShape: BrushShape;
  @Output()
  selectedShapeChange: EventEmitter<BrushShape> = new EventEmitter<BrushShape>();

  @ViewChildren('brushCanvas')
  private _canvases: QueryList<ElementRef<HTMLCanvasElement>>;

  ngOnChanges(changes: SimpleChanges): void {
    this.drawBrushes();
  }

  ngAfterViewInit(): void {
    this.drawBrushes();
  }

  selectShape(shape: BrushShape) {
    this.selectedShapeChange.emit(shape);
  }

  isSelected(shape: BrushShape): boolean {
    return brushShapesEqual(shape, this.selectedShape);
  }

  getNgClass(shape: BrushShape) {
    const ngClass = {};
    ngClass['tsp-brush-shape-picker__option--selected'] = this.isSelected(shape);

    return ngClass;
  }

  /** Draws every brush the way the tool paints it: black normally, white on the selected (dark blue) option */
  private drawBrushes() {
    if (this._canvases === undefined) {
      return;
    }
    this._canvases.forEach((canvasRef, index) => {
      const shape: BrushShape = this.options[index].shape;
      const brush: Brush = createBrushForShape(shape, this.isSelected(shape) ? COLOR_WHITE : COLOR_BLACK);
      const canvas: HTMLCanvasElement = canvasRef.nativeElement;
      canvas.getContext('2d').putImageData(this.brushToImageData(brush), 0, 0);
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

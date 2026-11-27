import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TextBox } from '../../types/base/text-box';
import { TextOptions } from '../../types/drawing-tools/drawing-tool-options';
import { Color } from '../../types/base/color';
import { Point } from '../../types/base/point';
import { RectangleArea } from '../../types/base/rectangle-area';
import { getMinTextBoxSize, getTextLayoutStyles, renderTextBox } from '../../helpers/text.helpers';
import { ALL_RESIZE_HANDLES, areaSize, moveArea, resizeArea, ResizeHandle } from '../../helpers/area.helpers';

/** Shortcuts that edit the text; other Ctrl shortcuts (Save, Open, ...) reach the app, which pastes the text first */
const TEXT_EDITING_CTRL_KEYS: string[] = [
  'a',
  'c',
  'v',
  'x',
  'z',
  'y',
  'arrowleft',
  'arrowright',
  'arrowup',
  'arrowdown',
  'home',
  'end',
  'backspace',
  'delete',
  'enter',
];

/**
 * The text box of the text tool, laid over the image. The canvas shows the text exactly as it will be pasted, in image
 * pixels scaled up by the zoom. On top of it a transparent textarea with the same size, font and line breaks takes
 * the typing, so the caret, selection, input methods and the clipboard all work the native way. The frame can be
 * dragged to move the box and its handles to resize it.
 */
@Component({
  selector: 'tsp-text-box',
  templateUrl: './text-box.component.html',
  styleUrls: ['./text-box.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TextBoxComponent implements OnChanges, AfterViewInit {
  @Input()
  textBox: TextBox;
  @Input()
  zoom: number = 1;
  /** The picture, which the box has to stay inside */
  @Input()
  image: ImageData;
  @Input()
  options: TextOptions;
  @Input()
  textColor: Color;
  /** The secondary color while Draw Opaque is on, otherwise undefined (a transparent background) */
  @Input()
  backgroundColor: Color | undefined;
  @Output()
  textChange: EventEmitter<string> = new EventEmitter<string>();
  @Output()
  areaChange: EventEmitter<RectangleArea> = new EventEmitter<RectangleArea>();
  @Output()
  cancel: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('canvas', { static: true })
  private _canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('textarea', { static: true })
  private _textarea: ElementRef<HTMLTextAreaElement>;

  readonly handles: ResizeHandle[] = ALL_RESIZE_HANDLES;
  readonly edges: string[] = ['top', 'right', 'bottom', 'left'];

  size: Point = { w: 0, h: 0 };
  textareaStyles: Record<string, string> = {};
  /** An empty image of the box's size, for the dashed frame */
  frameImage: ImageData;

  private _dragStartArea: RectangleArea;

  ngOnChanges(changes: SimpleChanges): void {
    this.size = areaSize(this.textBox.area);
    if (this.frameImage?.width !== this.size.w || this.frameImage?.height !== this.size.h) {
      this.frameImage = new ImageData(this.size.w, this.size.h);
    }
    this.textareaStyles = {
      ...getTextLayoutStyles(this.options, this.size.w),
      height: this.size.h + 'px',
      transform: `scale(${this.zoom})`,
    };
    this.render();
    if (changes.options || changes.textColor || changes.backgroundColor) {
      this.refocus();
    }
  }

  ngAfterViewInit(): void {
    const textarea: HTMLTextAreaElement = this._textarea.nativeElement;
    textarea.value = this.textBox.text;
    textarea.focus({ preventScroll: true });
  }

  onInput() {
    this.textChange.emit(this._textarea.nativeElement.value);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.cancel.emit();
      return;
    }
    const isAppShortcut: boolean =
      (event.ctrlKey || event.metaKey) && !TEXT_EDITING_CTRL_KEYS.includes(event.key.toLowerCase());
    if (!isAppShortcut) {
      // Delete, Ctrl+A, Ctrl+Z and the rest edit the text instead of the picture
      event.stopPropagation();
    }
  }

  /** The text is clipped at the bottom of the image, like in MS Paint, so the textarea must never scroll */
  resetScroll() {
    this._textarea.nativeElement.scrollTop = 0;
    this._textarea.nativeElement.scrollLeft = 0;
  }

  startDrag() {
    this._dragStartArea = this.textBox.area;
  }

  move(delta: Point) {
    this.areaChange.emit(moveArea(this._dragStartArea, this.toImagePixels(delta), this.imageSize()));
  }

  resize(handle: ResizeHandle, delta: Point) {
    const minSize: Point = getMinTextBoxSize(this.options);
    this.areaChange.emit(resizeArea(this._dragStartArea, handle, this.toImagePixels(delta), this.imageSize(), minSize));
  }

  private toImagePixels(delta: Point): Point {
    return { w: Math.round(delta.w / this.zoom), h: Math.round(delta.h / this.zoom) };
  }

  private imageSize(): Point {
    return { w: this.image.width, h: this.image.height };
  }

  private render() {
    const canvas: HTMLCanvasElement = this._canvas.nativeElement;
    canvas.width = this.size.w;
    canvas.height = this.size.h;
    const image: ImageData = renderTextBox({
      text: this.textBox.text,
      width: this.size.w,
      height: this.size.h,
      options: this.options,
      textColor: this.textColor,
      backgroundColor: this.backgroundColor,
    });
    canvas.getContext('2d').putImageData(image, 0, 0);
  }

  /** Brings the caret back after a click on the palette or the opaque/transparent picker, which take the focus away.
   * A field of the Fonts window keeps it, so the user can go on choosing there. */
  private refocus() {
    const textarea: HTMLTextAreaElement | undefined = this._textarea?.nativeElement;
    const active: Element | null = document.activeElement;
    if (textarea && (active === null || active === document.body)) {
      textarea.focus({ preventScroll: true });
    }
  }
}

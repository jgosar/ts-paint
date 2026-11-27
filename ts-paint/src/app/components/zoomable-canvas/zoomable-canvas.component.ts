import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, OnChanges } from '@angular/core';
import { Point } from '../../types/base/point';
import { Color } from '../../types/base/color';
import { makeColorTransparent } from '../../helpers/image.helpers';

@Component({
  selector: 'tsp-zoomable-canvas',
  templateUrl: './zoomable-canvas.component.html',
  styleUrls: ['./zoomable-canvas.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ZoomableCanvasComponent implements OnChanges {
  @Input()
  zoom: number = 1;
  @Input()
  image: ImageData;
  @Input()
  parentImage: ImageData;
  @Input()
  offset: Point = { w: 0, h: 0 };
  @Input()
  invertBackground: boolean = false;
  /** Pixels of this color are not drawn (a selection while Draw Opaque is off) */
  @Input()
  transparentColor: Color | undefined = undefined;
  @ViewChild('imageCanvas', { static: true })
  imageCanvas: ElementRef;

  zoomedWidth: number = 0;
  zoomedHeight: number = 0;
  zoomedOffsetW: number = 0;
  zoomedOffsetH: number = 0;

  ngOnChanges(): void {
    if (this.imageCanvas) {
      const canvas = this.imageCanvas.nativeElement;
      const context: CanvasRenderingContext2D = canvas.getContext('2d');

      if (this.image) {
        const parentWidth: number = (this.parentImage || this.image).width;
        const parentHeight: number = (this.parentImage || this.image).height;

        const canvasWidth: number =
          this.offset.w < 0
            ? this.image.width + this.offset.w
            : Math.min(this.image.width, parentWidth - this.offset.w);
        const canvasHeight: number =
          this.offset.h < 0
            ? this.image.height + this.offset.h
            : Math.min(this.image.height, parentHeight - this.offset.h);

        this.zoomedWidth = canvasWidth * this.zoom;
        this.zoomedHeight = canvasHeight * this.zoom;
        this.zoomedOffsetW = Math.max(this.offset?.w ?? 0, 0) * this.zoom;
        this.zoomedOffsetH = Math.max(this.offset?.h ?? 0, 0) * this.zoom;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const shownImage: ImageData =
          this.transparentColor === undefined ? this.image : makeColorTransparent(this.image, this.transparentColor);
        context.putImageData(shownImage, Math.min(this.offset.w, 0), Math.min(this.offset.h, 0));
      } else {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }
}

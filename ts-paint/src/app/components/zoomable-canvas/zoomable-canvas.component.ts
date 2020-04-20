import { Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { loadImageToCanvas } from 'src/app/helpers/canvas.helpers';
import { Point } from 'src/app/types/base/point';

@Component({
  selector: 'tsp-zoomable-canvas',
  templateUrl: './zoomable-canvas.component.html',
  styleUrls: ['./zoomable-canvas.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ZoomableCanvasComponent implements OnChanges {
  @Input()
  zoom: number = 1;
  @Input()
  image: ImageData;
  @Input()
  offset: Point = { w: 0, h: 0 };
  @ViewChild('imageCanvas', { static: true })
  imageCanvas: ElementRef;

  zoomedWidth: number = 0;
  zoomedHeight: number = 0;
  zoomedOffsetW: number = 0;
  zoomedOffsetH: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    this.zoomedWidth = (this.image?.width ?? 0) * this.zoom;
    this.zoomedHeight = (this.image?.height ?? 0) * this.zoom;
    this.zoomedOffsetW = (this.offset?.w ?? 0) * this.zoom;
    this.zoomedOffsetH = (this.offset?.h ?? 0) * this.zoom;

    if (changes.image && this.image && this.imageCanvas) {
      loadImageToCanvas(this.image, this.imageCanvas.nativeElement);
    }
  }
}

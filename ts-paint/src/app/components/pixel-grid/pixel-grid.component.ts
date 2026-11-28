import { Component, ChangeDetectionStrategy, Input, HostBinding, OnChanges, SimpleChanges } from '@angular/core';
import { createGridTile } from '../../helpers/grid.helpers';
import { loadImageToCanvas } from '../../helpers/canvas.helpers';

function createGridTileUrl(zoom: number): string {
  const canvas: HTMLCanvasElement = document.createElement('canvas');
  loadImageToCanvas(createGridTile(zoom), canvas);
  return `url(${canvas.toDataURL('image/png')})`;
}

/**
 * View > Zoom > Show Grid: lines between the pixels of the zoomed image, drawn over it. The lines are one css pixel
 * thick at any zoom, so they get thinner relative to the image pixels as the zoom grows.
 */
@Component({
  selector: 'tsp-pixel-grid',
  template: '',
  styleUrls: ['./pixel-grid.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PixelGridComponent implements OnChanges {
  @Input()
  zoom: number = 1;
  @Input()
  image: ImageData;

  @HostBinding('style.background-image')
  tileUrl: string;

  /** One pixel more than the zoomed image: room for the lines that close the grid on the right and at the bottom */
  @HostBinding('style.width.px')
  get width(): number {
    return this.image.width * this.zoom + 1;
  }

  @HostBinding('style.height.px')
  get height(): number {
    return this.image.height * this.zoom + 1;
  }

  @HostBinding('style.background-size.px')
  get tileSize(): number {
    return this.zoom;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['zoom']) {
      this.tileUrl = createGridTileUrl(this.zoom);
    }
  }
}

import { Component, ViewChild, ElementRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { loadImageToCanvas } from 'src/app/helpers/canvas.helpers';
import { TsPaintService } from 'src/app/services/ts-paint/ts-paint.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ImageFileData } from 'src/app/types/base/image-file-data';

@Component({
  selector: 'tsp-file-download',
  templateUrl: './file-download.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileDownloadComponent implements OnDestroy {
  @ViewChild('hiddenCanvas')
  public hiddenCanvas: ElementRef;
  @ViewChild('hiddenDownload')
  public hiddenDownload: ElementRef;

  private _ngUnsubscribe: Subject<undefined> = new Subject();

  constructor(private tsPaintService: TsPaintService) {
    tsPaintService.saveFileSubject
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((fileData) => {
        this.downloadImage(fileData);
      });
  }

  ngOnDestroy(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  downloadImage(fileData: ImageFileData) {
    loadImageToCanvas(fileData.imageData, this.hiddenCanvas.nativeElement);
    const hiddenDownloadElement = this.hiddenDownload.nativeElement;
    hiddenDownloadElement.href = this.hiddenCanvas.nativeElement.toDataURL("image/png");
    hiddenDownloadElement.download = fileData.fileName + '.png';
    hiddenDownloadElement.click();
  }
}

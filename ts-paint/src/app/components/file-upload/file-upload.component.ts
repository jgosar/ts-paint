import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ImageFileData } from 'src/app/types/base/image-file-data';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TsPaintService } from 'src/app/services/ts-paint/ts-paint.service';
import { PromiseParams } from 'src/app/types/async/promise-params';
import { PasteFileParams } from 'src/app/types/async/paste-file-params';

@Component({
  selector: 'tsp-file-upload',
  templateUrl: './file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent implements OnDestroy {
  @ViewChild('fileInput')
  fileInput: ElementRef;
  @ViewChild('hiddenCanvas')
  hiddenCanvas: ElementRef;

  private _ngUnsubscribe: Subject<undefined> = new Subject();
  private _openFilePromise: PromiseParams<ImageFileData>;
  private _pasteFilePromise: PasteFileParams;

  constructor(private tsPaintService: TsPaintService) {
    tsPaintService.openFileSubject
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((openFilePromise) => {
        if (this._openFilePromise) {
          this._openFilePromise.reject();
        }
        this._openFilePromise = openFilePromise;
        this.openFileDialog();
      });

    tsPaintService.pasteFileSubject
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((pasteFilePromise) => {
        if (this._pasteFilePromise) {
          this._pasteFilePromise.reject();
        }
        this._pasteFilePromise = pasteFilePromise;

        this.getImageDataFromUpload(pasteFilePromise.pastedFile).subscribe(imageData => {
          this._pasteFilePromise.resolve(imageData);
        });
      });
  }

  ngOnDestroy(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  fileUploaded(fileUploadEvent: any) {
    const uploadedFile: File = fileUploadEvent.target.files[0];
    const fileName: string = this.getFileNameWithoutExtension(uploadedFile.name);

    this.getImageDataFromUpload(uploadedFile)
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe(imageData => {
        this._openFilePromise.resolve({ imageData, fileName });
      });
  }

  private getFileNameWithoutExtension(fileName: string): string {
    if (fileName.includes('.')) {
      fileName = fileName.substring(0, fileName.lastIndexOf('.'));
    }

    return fileName;
  }

  public getImageDataFromUpload(uploadedFile: File): Observable<ImageData> {
    const canvas: HTMLCanvasElement = this.hiddenCanvas.nativeElement;
    const fileReader: FileReader = new FileReader();

    const result: Observable<ImageData> = new Observable<ImageData>(subscriber => {
      fileReader.onload = (progress: any) => {
        const imgUrl: string = <string>progress.target.result; // TODO: What if this is an ArrayBuffer?

        var image: HTMLImageElement = new Image;
        image.src = imgUrl;
        image.onload = (e: Event) => {
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);

          var imageData: ImageData = context.getImageData(0, 0, image.width, image.height);
          subscriber.next(imageData);
          subscriber.complete();
        };
      };
    });

    fileReader.readAsDataURL(uploadedFile);

    return result;
  }
}

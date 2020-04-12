import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FileUploadEvent } from 'src/app/types/file-upload/file-upload-event';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TsPaintService } from 'src/app/services/ts-paint/ts-paint.service';
import { TsPaintStore } from 'src/app/services/ts-paint/ts-paint.store';

@Component({
  selector: 'tsp-file-upload',
  templateUrl: './file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent implements OnDestroy {
  //@Output()
  //imageUploaded: EventEmitter<FileUploadEvent> = new EventEmitter<FileUploadEvent>();

  @ViewChild('fileInput')
  fileInput: ElementRef;
  @ViewChild('hiddenCanvas')
  hiddenCanvas: ElementRef;

  private ngUnsubscribe$: Subject<undefined> = new Subject();

  constructor(private tsPaintService: TsPaintService,
    private tsPaintStore: TsPaintStore) {
    tsPaintService.openFileUploadDialogSubject
      .pipe(takeUntil(this.ngUnsubscribe$))
      .subscribe(() => {
        this.openFileDialog();
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }

  fileUploaded(fileUploadEvent: any) {
    const uploadedFile: File = fileUploadEvent.target.files[0];
    const fileName: string = this.getFileNameWithoutExtension(uploadedFile.name);

    this.getImageDataFromUpload(uploadedFile)
      .pipe(takeUntil(this.ngUnsubscribe$))
      .subscribe(imageData => {
        //this.imageUploaded.emit({ imageData, fileName });
        this.tsPaintStore.imageUploaded({ imageData, fileName });
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

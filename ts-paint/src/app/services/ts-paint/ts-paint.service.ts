import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { FileUploadEvent } from 'src/app/types/file-upload/file-upload-event';
import { PromiseParams } from 'src/app/types/async/promise-params';

@Injectable()
export class TsPaintService {
  openFileSubject: Subject<PromiseParams<FileUploadEvent>> = new Subject<PromiseParams<FileUploadEvent>>();

  openFile(): Promise<FileUploadEvent> {
    return new Promise<FileUploadEvent>((resolve, reject) => {
      this.openFileSubject.next({ resolve, reject });
    });
  }
}
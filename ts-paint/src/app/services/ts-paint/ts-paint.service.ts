import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ImageFileData } from 'src/app/types/base/image-file-data';
import { PromiseParams } from 'src/app/types/async/promise-params';

@Injectable()
export class TsPaintService {
  openFileSubject: Subject<PromiseParams<ImageFileData>> = new Subject<PromiseParams<ImageFileData>>();
  saveFileSubject: Subject<ImageFileData> = new Subject<ImageFileData>();

  openFile(): Promise<ImageFileData> {
    return new Promise<ImageFileData>((resolve, reject) => {
      this.openFileSubject.next({ resolve, reject });
    });
  }

  saveFile(fileData: ImageFileData) {
    this.saveFileSubject.next(fileData);
  }
}
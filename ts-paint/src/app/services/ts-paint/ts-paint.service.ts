import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ImageFileData } from 'src/app/types/base/image-file-data';
import { PromiseParams } from 'src/app/types/async/promise-params';
import { PasteFileParams } from 'src/app/types/async/paste-file-params';

@Injectable()
export class TsPaintService {
  openFileSubject: Subject<PromiseParams<ImageFileData>> = new Subject<PromiseParams<ImageFileData>>();
  pasteFileSubject: Subject<PasteFileParams> = new Subject<PasteFileParams>();

  openFile(): Promise<ImageFileData> {
    return new Promise<ImageFileData>((resolve, reject) => {
      this.openFileSubject.next({ resolve, reject });
    });
  }

  pasteFile(pastedFile: File): Promise<ImageData> {
    return new Promise<ImageData>((resolve, reject) => {
      this.pasteFileSubject.next({ resolve, reject, pastedFile });
    });
  }
}
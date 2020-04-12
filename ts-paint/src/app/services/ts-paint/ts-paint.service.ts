import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class TsPaintService {
  openFileUploadDialogSubject: Subject<void> = new Subject<void>();

  openFileUploadDialog() {
    this.openFileUploadDialogSubject.next();
  }
}
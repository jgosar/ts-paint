import { Component, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TsPaintStore } from '../../services/ts-paint/ts-paint.store';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { isDefined } from '../../helpers/typescript.helpers';

@Component({
  selector: 'tsp-ts-paint',
  templateUrl: './ts-paint.component.html',
  styleUrls: ['./ts-paint.component.less'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TsPaintComponent implements OnInit {
  constructor(public store: TsPaintStore, private _activatedRoute: ActivatedRoute) {
    this._activatedRoute.queryParams.subscribe((params) => {
      if (isDefined(params['imageUrl'])) {
        store.loadFileFromUrl(params['imageUrl']);
      }
    });
    // Files opened with the installed app ("Open with TS Paint") arrive here with a writable handle (Chromium only).
    window.launchQueue?.setConsumer((launchParams) => this.openLaunchedFile(launchParams));
  }

  private async openLaunchedFile(launchParams: LaunchParams): Promise<void> {
    const handle: FileSystemHandle | undefined = launchParams.files[0];
    if (handle?.kind !== 'file') {
      return;
    }
    const fileHandle: FileSystemFileHandle = handle as FileSystemFileHandle;
    const file: File = await fileHandle.getFile();
    await this.store.loadFile(file, Promise.resolve(fileHandle));
  }

  ngOnInit(): void {
    this.store.setDrawingTool(DrawingToolType.line);
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: any) {
    const pastedFile: File = event.clipboardData.items[0].getAsFile();

    this.store.pasteFile(pastedFile);
  }

  @HostListener('dragover', ['$event'])
  onDragover(event: any) {
    // We need to prevent default handling of dragover event in order to process the drop event
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener('drop', ['$event'])
  onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    const droppedItem: DataTransferItem = event.dataTransfer.items[0];
    const droppedFile: File = droppedItem.getAsFile();
    // Chromium only: must be requested synchronously inside the drop handler, the promise can be awaited later.
    const fileHandle: Promise<FileSystemHandle | null> = droppedItem.getAsFileSystemHandle
      ? droppedItem.getAsFileSystemHandle().catch(() => null)
      : Promise.resolve(null);

    this.store.loadFile(droppedFile, fileHandle);
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const executed: boolean = this.store.executeHotkeyAction(event);
    if (executed) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunload(event: any) {
    if (this.store.state.unsavedChanges) {
      event.returnValue = true;
    }
  }
}

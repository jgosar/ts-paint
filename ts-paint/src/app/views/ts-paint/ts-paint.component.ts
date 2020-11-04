import { isDefined } from '@angular/compiler/src/util';
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TsPaintStore } from '../../services/ts-paint/ts-paint.store';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';

@Component({
  selector: 'tsp-ts-paint',
  templateUrl: './ts-paint.component.html',
  styleUrls: ['./ts-paint.component.less'],
})
export class TsPaintComponent implements OnInit {
  constructor(public store: TsPaintStore, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (isDefined(params['imageUrl'])) {
        store.loadFileFromUrl(params['imageUrl']);
      }
    });
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
    const pastedFile: File = event.dataTransfer.items[0].getAsFile();

    this.store.loadFile(pastedFile);
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

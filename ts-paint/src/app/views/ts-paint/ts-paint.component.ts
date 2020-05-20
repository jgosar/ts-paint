import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { TsPaintStore } from '../../services/ts-paint/ts-paint.store';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';

@Component({
  selector: 'tsp-ts-paint',
  templateUrl: './ts-paint.component.html',
  styleUrls: ['./ts-paint.component.less']
})
export class TsPaintComponent implements OnInit {

  constructor(public store: TsPaintStore, private _element: ElementRef) {

  }

  ngOnInit(): void {
    this.store.setDrawingTool(DrawingToolType.line);
    setTimeout(() => {
      this._element.nativeElement.click();
    });
  }

  onPaste(event: any) {
    const pastedFile: File = event.clipboardData.items[0].getAsFile();

    this.store.pasteFile(pastedFile);
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

import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { TsPaintStore } from '../../services/ts-paint/ts-paint.store';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { copyImagePart } from '../../helpers/image.helpers';

@Component({
  selector: 'tsp-ts-paint',
  templateUrl: './ts-paint.component.html',
  styleUrls: ['./ts-paint.component.less']
})
export class TsPaintComponent implements OnInit {

  constructor(public store: TsPaintStore,
    private element: ElementRef) { }

  ngOnInit(): void {
    this.store.setDrawingTool(DrawingToolType.line);
    setTimeout(() => {
      this.element.nativeElement.click();
    });
  }

  onPaste(event: any) {
    const pastedFile: File = event.clipboardData.items[0].getAsFile();

    this.store.pasteFile(pastedFile);
  }

  onCopy() {
    if (this.store.state.selectionImage) {
      copyImagePart(this.store.state.selectionImage);
    }
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const executed: boolean = this.store.executeHotkeyAction(event);
    if (executed) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

}

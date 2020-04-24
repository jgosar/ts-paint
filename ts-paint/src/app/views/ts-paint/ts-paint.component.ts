import { Component, OnInit } from '@angular/core';
import { TsPaintStore } from 'src/app/services/ts-paint/ts-paint.store';
import { DrawingToolType } from 'src/app/types/drawing-tools/drawing-tool-type';
import { copyImagePart } from 'src/app/helpers/image.helpers';

@Component({
  selector: 'tsp-ts-paint',
  templateUrl: './ts-paint.component.html',
  styleUrls: ['./ts-paint.component.less']
})
export class TsPaintComponent implements OnInit {

  constructor(public store: TsPaintStore) { }

  ngOnInit(): void {
    this.store.setDrawingTool(DrawingToolType.line);
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

}

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tsp-ts-paint',
  templateUrl: './ts-paint.component.html',
  styleUrls: ['./ts-paint.component.less']
})
export class TsPaintComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  onPaste(event: any) {
    /*const pastedFile: File = event.clipboardData.items[0].getAsFile();
    if (pastedFile !== null) {
      this.fileUpload.getImageDataFromUpload(pastedFile).subscribe(imageData => {
        this.putAndSelectImagePart(imageData, new Point([0, 0]));
      });
    }*/
  }

  onCopy() {
    /*if (this.selectedDrawingTool && this.selectedDrawingTool instanceof MoveSelectionTool) {
      const selection: ImageData = this.selectedDrawingTool.imageSelection;

      this.selectionCopy.copySelectionToClipboard(selection);
    }*/
  }

}

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TsPaintComponent } from './views/ts-paint/ts-paint.component';
import { TsPaintStore } from './services/ts-paint/ts-paint.store';
import { MenuComponent } from './components/menu/menu.component';
import { ZoomableCanvasComponent } from './components/zoomable-canvas/zoomable-canvas.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { TsPaintService } from './services/ts-paint/ts-paint.service';
import { FileDownloadComponent } from './components/file-download/file-download.component';
import { MouseTrackerComponent } from './components/mouse-tracker/mouse-tracker.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';
import { PaletteComponent } from './components/palette/palette.component';

@NgModule({
  declarations: [
    AppComponent,
    TsPaintComponent,
    MenuComponent,
    ZoomableCanvasComponent,
    FileUploadComponent,
    FileDownloadComponent,
    MouseTrackerComponent,
    ToolboxComponent,
    PaletteComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [TsPaintStore, TsPaintService],
  bootstrap: [AppComponent]
})
export class AppModule { }

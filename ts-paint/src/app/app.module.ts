import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TsPaintComponent } from './views/ts-paint/ts-paint.component';
import { TsPaintStore } from './services/ts-paint/ts-paint.store';
import { MenuComponent } from './components/menu/menu.component';
import { ZoomableCanvasComponent } from './components/zoomable-canvas/zoomable-canvas.component';

@NgModule({
  declarations: [
    AppComponent,
    TsPaintComponent,
    MenuComponent,
    ZoomableCanvasComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [TsPaintStore],
  bootstrap: [AppComponent]
})
export class AppModule { }

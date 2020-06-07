import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TsPaintComponent } from './views/ts-paint/ts-paint.component';
import { TsPaintStore } from './services/ts-paint/ts-paint.store';
import { MenuComponent } from './components/menu/menu.component';
import { ZoomableCanvasComponent } from './components/zoomable-canvas/zoomable-canvas.component';
import { MouseTrackerComponent } from './components/mouse-tracker/mouse-tracker.component';
import { ToolboxComponent } from './components/toolbox/toolbox.component';
import { PaletteComponent } from './components/palette/palette.component';
import { SelectionFrameComponent } from './components/selection-frame/selection-frame.component';
import { ModalWindowComponent } from './components/modal-window/modal-window.component';
import { AttributesWindowComponent } from './components/attributes-window/attributes-window.component';
import { FormsModule } from '@angular/forms';
import { IntegerInputComponent } from './components/inputs/integer-input/integer-input.component';
import { FooterInfoComponent } from './components/footer-info/footer-info.component';
import { RadioButtonGroupComponent } from './components/inputs/radio-button-group/radio-button-group.component';

@NgModule({
  declarations: [
    AppComponent,
    TsPaintComponent,
    MenuComponent,
    ZoomableCanvasComponent,
    MouseTrackerComponent,
    ToolboxComponent,
    PaletteComponent,
    SelectionFrameComponent,
    ModalWindowComponent,
    AttributesWindowComponent,
    FooterInfoComponent,
    IntegerInputComponent, // TODO: make a separate inputs module
    RadioButtonGroupComponent, // TODO: make a separate inputs module
  ],
  imports: [BrowserModule, FormsModule],
  providers: [TsPaintStore],
  bootstrap: [AppComponent],
})
export class AppModule {}

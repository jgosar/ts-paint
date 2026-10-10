import { BrowserModule } from '@angular/platform-browser';
import { NgModule, inject, isDevMode, provideAppInitializer } from '@angular/core';

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
import { SaveAsWindowComponent } from './components/save-as-window/save-as-window.component';
import { FormsModule } from '@angular/forms';
import { IntegerInputComponent } from './components/inputs/integer-input/integer-input.component';
import { FooterInfoComponent } from './components/footer-info/footer-info.component';
import { FlipRotateWindowComponent } from './components/flip-rotate-window/flip-rotate-window.component';
import { RadioButtonGroupComponent } from './components/inputs/radio-button-group/radio-button-group.component';
import { DropdownComponent } from './components/inputs/dropdown/dropdown.component';
import { TextInputComponent } from './components/inputs/text-input/text-input.component';
import { AboutPaintWindowComponent } from './components/about-paint-window/about-paint-window.component';
import { ImageScrollerComponent } from './components/image-scroller/image-scroller.component';
import { StretchSkewWindowComponent } from './components/stretch-skew-window/stretch-skew-window.component';
import { RouterModule } from '@angular/router';
import { DrawingToolOptionsComponent } from './components/drawing-tool-options/drawing-tool-options.component';
import { FillTypePickerComponent } from './components/fill-type-picker/fill-type-picker.component';
import { LineThicknessPickerComponent } from './components/line-thickness-picker/line-thickness-picker.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AppUpdateService } from './services/app-update/app-update.service';
import { PixelScalingService } from './services/pixel-scaling/pixel-scaling.service';

@NgModule({
  declarations: [
    AppComponent,
    TsPaintComponent,
    MenuComponent,
    ZoomableCanvasComponent,
    MouseTrackerComponent,
    ImageScrollerComponent,
    ToolboxComponent,
    PaletteComponent,
    SelectionFrameComponent,
    ModalWindowComponent,
    AttributesWindowComponent,
    SaveAsWindowComponent,
    FlipRotateWindowComponent,
    StretchSkewWindowComponent,
    AboutPaintWindowComponent,
    FooterInfoComponent,
    DrawingToolOptionsComponent,
    FillTypePickerComponent,
    LineThicknessPickerComponent,
    IntegerInputComponent, // TODO: make a separate inputs module
    RadioButtonGroupComponent, // TODO: make a separate inputs module
    DropdownComponent, // TODO: make a separate inputs module
    TextInputComponent, // TODO: make a separate inputs module
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot([], {}),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
  providers: [
    TsPaintStore,
    provideAppInitializer(() => {
      inject(AppUpdateService).start();
      inject(PixelScalingService).start();
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

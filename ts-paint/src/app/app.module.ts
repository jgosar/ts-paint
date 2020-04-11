import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TsPaintComponent } from './ts-paint/ts-paint.component';

@NgModule({
  declarations: [
    AppComponent,
    TsPaintComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

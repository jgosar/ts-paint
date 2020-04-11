import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TsPaintComponent } from './views/ts-paint/ts-paint.component';
import { TsPaintStore } from './services/ts-paint/ts-paint.store';
import { MenusComponent } from './components/menus/menus.component';

@NgModule({
  declarations: [
    AppComponent,
    TsPaintComponent,
    MenusComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [TsPaintStore],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TsPaintComponent } from './views/ts-paint/ts-paint.component';
import { TsPaintStore } from './services/ts-paint/ts-paint.store';
import { MenuComponent } from './components/menu/menu.component';

@NgModule({
  declarations: [
    AppComponent,
    TsPaintComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [TsPaintStore],
  bootstrap: [AppComponent]
})
export class AppModule { }

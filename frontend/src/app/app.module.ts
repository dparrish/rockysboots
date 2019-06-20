import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {EditorComponent} from './editor/editor.component';
import {EventLoop} from './event';
import {GameComponent} from './game/game.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    GameComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    NgbModule,
  ],
  providers: [
    EventLoop,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}

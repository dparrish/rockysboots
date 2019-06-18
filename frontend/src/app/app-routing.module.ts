import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {EditorComponent} from './editor/editor.component';
import {GameComponent} from './game/game.component';

const routes: Routes = [
  {path: 'editor', component: EditorComponent},
  {path: '', component: GameComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}

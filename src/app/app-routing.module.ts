import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SessionComponent } from './pages/session/session.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent},
  {path: 'session', component: SessionComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

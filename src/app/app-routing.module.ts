import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { FinishedComponent } from './pages/finished/finished.component';
import { SessionComponent } from './pages/session/session.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'session', component: SessionComponent },
  { path: 'finished', component: FinishedComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

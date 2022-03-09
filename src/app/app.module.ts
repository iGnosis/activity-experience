import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { SessionComponent } from './pages/session/session.component';
import { GuideComponent } from './widgets/guide/guide.component';
import { SpotlightComponent } from './widgets/spotlight/spotlight.component';
import { VideoComponent } from './widgets/video/video.component';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    SessionComponent,
    GuideComponent,
    SpotlightComponent,
    VideoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

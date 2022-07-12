import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { SessionComponent } from './pages/session/session.component';
import { GuideComponent } from './widgets/guide/guide.component';
import { SpotlightComponent } from './widgets/spotlight/spotlight.component';
import { VideoComponent } from './widgets/video/video.component';
import { CalibrationComponent } from './widgets/calibration/calibration.component';
import { StoreModule } from '@ngrx/store';
import { guideReducer } from './store/reducers/guide.reducer';
import { sessionReducer } from './store/reducers/session.reducer';
import { spotlightReducer } from './store/reducers/spotlight.reducer';
import { AnnouncementComponent } from './widgets/announcement/announcement.component';
import { PreSessionSurveyComponent } from './widgets/pre-session-survey/pre-session-survey.component';
import { SelectGenreComponent } from './widgets/select-genre/select-genre.component';
import { FinishedComponent } from './pages/finished/finished.component';
import { TestComponent } from './pages/test/test.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { announcementReducer } from './store/reducers/annoucement.reducer';
import { SafePipeModule } from 'safe-pipe';
import { LottieModule } from 'ngx-lottie';

export function playerFactory(): any {
  return import('lottie-web');
}

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    SessionComponent,
    GuideComponent,
    SpotlightComponent,
    VideoComponent,
    CalibrationComponent,
    AnnouncementComponent,
    PreSessionSurveyComponent,
    SelectGenreComponent,
    FinishedComponent,
    TestComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    StoreModule.forRoot({
      guide: guideReducer, // Updating the guide
      session: sessionReducer, // Top level session
      spotlight: spotlightReducer, // spotlight component
      announcement: announcementReducer,
    }),
    FontAwesomeModule,
    SafePipeModule,
    LottieModule.forRoot({ player: playerFactory }),
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}

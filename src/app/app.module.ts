import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { SessionComponent } from './pages/session/session.component';
import { GuideComponent } from './widgets/guide/guide.component';
import { SpotlightComponent } from './widgets/spotlight/spotlight.component';
import { VideoComponent } from './widgets/video/video.component';
import { CalibrationComponent } from './widgets/calibration/calibration.component';
import { StoreModule } from '@ngrx/store';
import { calibrationReducer } from './store/reducers/calibration/calibration.reducer';
import { frameReducer } from './store/reducers/frame/frame.reducer';
import { poseReducer } from './store/reducers/pose/pose.reducer';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    SessionComponent,
    GuideComponent,
    SpotlightComponent,
    VideoComponent,
    CalibrationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    StoreModule.forRoot({
      calibration: calibrationReducer, 
      frame: frameReducer,
      pose: poseReducer,
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

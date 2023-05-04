import { CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GuideComponent } from './widgets/elements/guide/guide.component';
import { ConfettiComponent } from './widgets/elements/confetti/confetti.component';
import { StoreModule } from '@ngrx/store';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { gameReducer } from './store/reducers/game.reducer';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SafePipeModule } from 'safe-pipe';
import { ElementsComponent } from './widgets/elements/elements.component';
import { GameComponent } from './pages/game/game.component';
import { ScoreComponent } from './widgets/elements/score/score.component';
import { TimerComponent } from './widgets/elements/timer/timer.component';
import { PromptComponent } from './widgets/elements/prompt/prompt.component';
import { TimeoutComponent } from './widgets/elements/timeout/timeout.component';
import { RibbonComponent } from './widgets/elements/ribbon/ribbon.component';
import { OverlayComponent } from './widgets/elements/overlay/overlay.component';
import { BannerComponent } from './widgets/elements/banner/banner.component';
import { VideoElementComponent } from './widgets/elements/video/video.component';
import { SafePipe } from 'src/pipes/safe/safe.pipe';
import { preferenceReducer } from './store/reducers/preference.reducer';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from 'src/environments/environment';
import { ToastComponent } from './widgets/elements/toast/toast.component';
import { CalibrationTutorialComponent } from './widgets/elements/calibration-tutorial/calibration-tutorial.component';
import { HealthComponent } from './widgets/elements/health/health.component';
import { GameMenuComponent } from './widgets/elements/game-menu/game-menu.component';
import { UnlockNotificationComponent } from './widgets/elements/unlock-notification/unlock-notification.component';
import { GoalSelectionComponent } from './widgets/elements/goal-selection/goal-selection.component';
import { TitleBarComponent } from './widgets/elements/title-bar/title-bar.component';

export let AppInjector: Injector;

@NgModule({
  declarations: [
    AppComponent,
    GuideComponent,
    ToastComponent,
    ConfettiComponent,
    VideoElementComponent,
    ElementsComponent,
    GameComponent,
    ScoreComponent,
    TimerComponent,
    PromptComponent,
    TimeoutComponent,
    RibbonComponent,
    OverlayComponent,
    BannerComponent,
    SafePipe,
    CalibrationTutorialComponent,
    HealthComponent,
    GameMenuComponent,
    UnlockNotificationComponent,
    GoalSelectionComponent,
    TitleBarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    StoreModule.forRoot({
      game: gameReducer, // Main game state
      preference: preferenceReducer,
    }),
    StoreDevtoolsModule.instrument({
      name: 'Activity Experience',
      logOnly: environment.production,
    }),
    FontAwesomeModule,
    SafePipeModule,
    CarouselModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {
  constructor(private injector: Injector) {
    AppInjector = this.injector;
  }
}

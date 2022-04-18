import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { CalibrationService } from 'src/app/services/calibration/calibration.service';
import { CareplanService } from 'src/app/services/careplan/careplan.service';
import { SitToStandService } from 'src/app/services/classifiers/sit-to-stand/sit-to-stand.service';
import { HolisticService } from 'src/app/services/holistic/holistic.service';
import { OnboardingService } from 'src/app/services/onboarding/onboarding.service';
import { SessionService } from 'src/app/services/session/session.service';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
import { VideoService } from 'src/app/services/video/video.service';
import { session as sessionAction } from 'src/app/store/actions/session.actions';
import { SessionRow, SessionState } from 'src/app/types/pointmotion';
@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss'],
})
export class SessionComponent implements AfterViewInit {
  @ViewChild('videoElm') video!: ElementRef;
  @ViewChild('canvasElm') canvas!: ElementRef;
  @ViewChild('sessionElm') sessionElm!: ElementRef;
  game?: Phaser.Game;
  session: SessionRow | undefined;
  config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-canvas',
    // @ts-ignore
    'render.transparent': true,
    transparent: true,
    // backgroundColor: 'rgba(0,0,0,0)',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 200 },
      },
    },
  };
  careplan: any;
  isEndSessionVisible = false;
  announcement = '';
  selectGenre = false;

  sessionEnded: boolean = true;

  // DI the needed scenes
  constructor(
    private store: Store<{ spotlight: any; session: SessionState }>,
    private analyticsService: AnalyticsService,
    private uiHelperService: UiHelperService,
    private careplanService: CareplanService,
    private mpHolisticService: HolisticService,
    private sit2standService: SitToStandService,
    private sessionService: SessionService,
    private calibrationScene: CalibrationScene,
    private sit2standScene: SitToStandScene,
    private onboardingService: OnboardingService,
    private router: Router
  ) {
    this.store
      .select((state) => state.session.session)
      .subscribe((session) => {
        this.session = session;
      });
  }

  async ngAfterViewInit() {
    // start the video
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    this.video.nativeElement.srcObject = stream;

    // aspect ratio of the screen and webcam may be different. make calculations easier
    const box = this.uiHelperService.setBoundingBox(stream);
    this.updateDimensions(this.video.nativeElement);

    this.startGame();

    this.onboardingService.start(this, () => {});
    // this.startMediaPipe()
  }

  updateDimensions(elm: HTMLVideoElement | HTMLCanvasElement) {
    console.log(elm.style.marginLeft);
    console.log(elm.width);
    console.log(elm.height);
    const box = this.uiHelperService.getBoundingBox();
    if (box.topLeft.x) {
      // the video needs padding on the left
      elm.style.marginLeft = box.topLeft.x + 'px';
    } else if (box.topLeft.y) {
      // the video needs padding on the top
      elm.style.marginTop = box.topLeft.y + 'px';
      elm.style.marginTop = box.topLeft.y + 'px';
    }

    elm.width = box.topRight.x - box.topLeft.x;
    elm.height = box.bottomLeft.y - box.topLeft.y;
    console.log(elm.style.marginLeft);
    console.log(elm.width);
    console.log(elm.height);
  }

  async startGame() {
    const scenes = [this.calibrationScene, this.sit2standScene];
    this.config.scene = scenes;
    this.game = new Phaser.Game(this.config);
    this.updateDimensions(this.canvas.nativeElement.querySelector('canvas'));
    setTimeout(() => {
      // Set the canvas to take up the same space as the video. Simplifying all the calculations

      //   this.updateDimensions(this.canvas.nativeElement);

      this.analyticsService.sendSessionEvent({
        event_type: 'sessionStarted',
      });

      // Start mediapipe
      this.startMediaPipe();
    });
  }

  async startCalibration() {
    this.sit2standService.action_disable();
    if (this.game?.scene.isActive('sit2stand')) {
      this.game.scene.stop('sit2stand');
      console.log('sit2stand is active. turning off');
      this.game?.scene.start('calibration');
      console.log('start calibration');
      // this.action_startMediaPipe()
    } else {
      console.log('calibration is already active');
    }
  }

  startSit2Stand() {
    this.sit2standService.action_enable();
    if (this.game?.scene.isActive('calibration')) {
      this.game.scene.stop('calibration');
      console.log('calibration is active. turning off');
      this.game?.scene.start('sit2stand');
      console.log('start sit 2 stand');
    } else {
      console.log('sit2stand is already active');
    }
  }

  startMediaPipe(data?: any) {
    // Start MediaPipe Holistic
    console.log('STARTING MEDIAPIPE');
    setTimeout(() => {
      this.mpHolisticService.start(this.video.nativeElement, 20);
    }, 2000); // gives time for things to settle down
  }

  async sendSessionEndedEvent() {
    console.log('sending end session event');
    try {
      await this.analyticsService.sendSessionEvent({
        event_type: 'sessionEnded',
      });
    } catch (err) {
      console.error(err);
    }
    this.router.navigate(['/finished']);
  }

  timeoutId?: any;
  showEndSession() {
    this.isEndSessionVisible = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.isEndSessionVisible = false;
    }, 2000);
  }

  callAlert() {
    console.log('hi');
  }

  announce(msg: string) {
    return new Promise((resolve) => {
      this.announcement = msg;
      setTimeout(() => {
        this.announcement = '';
        resolve({});
      }, 3000);
    });
  }

  askPreferredGenre() {
    this.selectGenre = true;
  }

  genreSelected(genre: string) {
    this.selectGenre = false;
    this.onboardingService.start(this, () => {});
  }
}

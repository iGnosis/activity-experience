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
import { SessionService } from 'src/app/services/session/session.service';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
import { VideoService } from 'src/app/services/video/video.service';
import { session as sessionAction } from 'src/app/store/actions/session.actions';
import { SessionState } from 'src/app/types/pointmotion';
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

  sessionEnded: boolean = true;

  //temporary
  showCelebration = false;

  // DI the needed scenes
  constructor(
    private store: Store<{ spotlight: any, session: SessionState}>,
    private analyticsService: AnalyticsService,
    private uiHelperService: UiHelperService,
    private careplanService: CareplanService,
    private mpHolisticService: HolisticService,
    private sit2standService: SitToStandService,
    private sessionService: SessionService,
    private calibrationScene: CalibrationScene,
    private sit2standScene: SitToStandScene,
    private router: Router
  ) {
    this.store.select(state => state.session.session).subscribe(session => {
      console.log('session id', session);
    })
  }

  async ngAfterViewInit() {
    // Use this for analytics
    const session = await this.sessionService.new();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    this.video.nativeElement.srcObject = stream;

    // Register the session component to send and receive events
    // this.dispatcher = this.eventsService.addContext('session', this);
    //   this.dispatcher?.dispatchEventName('ready');

    const box = this.uiHelperService.setBoundingBox(stream);
    this.updateDimensions(this.video.nativeElement);

    this.store
      .select((state) => state.spotlight)
      .subscribe((val) => {
        this.showCelebration = true;
        setTimeout(() => {
          this.showCelebration = false;
        }, 2000);
      });

    this.startGame();
    // updating scenes in the Phaser game config
    const scenes = [this.calibrationScene, this.sit2standScene];
    this.config.scene = scenes;
    this.game = new Phaser.Game(this.config);
  }

  updateDimensions(elm: HTMLVideoElement | HTMLCanvasElement) {
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
  }

  async startCalibration() {
    this.sit2standService.action_disable()
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
  async startGame() {
    setTimeout(() => {
      // Set the canvas to take up the same space as the video. Simplifying all the calculations
      const canvas = document.querySelector(
        '#phaser-canvas canvas'
      ) as HTMLCanvasElement;
      this.updateDimensions(canvas);

      this.analyticsService.sendSessionEvent({
        event_type: 'sessionStarted',
      });

      // Start mediapipe
      this.action_startMediaPipe()
    });
  }

  startSit2Stand() {
    this.sit2standService.action_enable()
    if (this.game?.scene.isActive('calibration')) {
      this.game.scene.stop('calibration');
      console.log('calibration is active. turning off');
      this.game?.scene.start('sit2stand');
      console.log('start sit 2 stand');
    } else {
      console.log('sit2stand is already active');
    }
  }

  action_startMediaPipe(data?: any) {
    // Start MediaPipe Holistic
    console.log('STARTING MEDIAPIPE');
    setTimeout(() => {
      this.mpHolisticService.start(this.video.nativeElement, 20);
    }, 2000); // gives time for things to settle down
  }

  action_restartGame(data: any) {}

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
}

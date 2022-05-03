import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { CareplanService } from 'src/app/services/careplan/careplan.service';
import { SitToStandService } from 'src/app/services/classifiers/sit-to-stand/sit-to-stand.service';
import { CoordinationService } from 'src/app/services/coordination/coordination.service';
import { HolisticService } from 'src/app/services/holistic/holistic.service';
import { SessionService } from 'src/app/services/session/session.service';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
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
    render: {
      transparent: true
    },
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

  sessionEnded = true;

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
    private coordinationService: CoordinationService,
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
    console.log('setBoundingBox:box:', box)
    this.updateDimensions(this.video.nativeElement);

    this.startGame();
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

  async startGame() {
    const scenes = [this.calibrationScene, this.sit2standScene];
    this.config.scene = scenes;
    this.game = new Phaser.Game(this.config);
    this.coordinationService.start(this.game as Phaser.Game, () => { })
    this.updateDimensions(this.canvas.nativeElement.querySelector('canvas'));
    setTimeout(() => {
      this.analyticsService.sendSessionEvent({
        event_type: 'sessionStarted',
      });

      // Start mediapipe
      this.startMediaPipe();
    });
  }

  startMediaPipe() {
    // Start MediaPipe Holistic
    console.log('STARTING MEDIAPIPE');
    setTimeout(() => {
      this.mpHolisticService.start(this.video.nativeElement);
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
}

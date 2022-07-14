import { AfterViewInit, Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';
import { CareplanService } from 'src/app/services/careplan/careplan.service';
import { SitToStandService } from 'src/app/services/classifiers/sit-to-stand/sit-to-stand.service';
import { CoordinationService } from 'src/app/services/coordination/coordination.service';
import { SessionService } from 'src/app/services/session/session.service';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
import { SessionRow, SessionState } from 'src/app/types/pointmotion';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { session } from 'src/app/store/actions/session.actions';
import { PoseService } from 'src/app/services/pose/pose.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss'],
})
export class SessionComponent implements AfterViewInit {
  @ViewChild('videoElm') video!: ElementRef;
  @ViewChild('canvasElm') canvas!: ElementRef;
  @ViewChild('sessionElm') sessionElm!: ElementRef;
  @ViewChild('sessionCloseModal', { read: TemplateRef })
  sessionCloseModal: TemplateRef<any>;
  @ViewChild('noVideoModal', { read: TemplateRef })
  noVideoModal: TemplateRef<any>;
  game?: Phaser.Game;
  session: SessionRow | undefined;
  config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-canvas',
    render: {
      transparent: true,
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
  chevronRightIcon = faChevronRight;
  isEndSessionVisible = false;
  announcement = '';
  selectGenre = false;
  noVideoError: string;
  videoAvailable = false;

  sessionEnded: boolean | undefined = false;

  // DI the needed scenes
  constructor(
    private store: Store<{ spotlight: any; session: SessionState }>,
    private analyticsService: AnalyticsService,
    private uiHelperService: UiHelperService,
    private careplanService: CareplanService,
    private poseService: PoseService,
    private sit2standService: SitToStandService,
    private sessionService: SessionService,
    private calibrationScene: CalibrationScene,
    private sit2standScene: SitToStandScene,
    private coordinationService: CoordinationService,
    private router: Router,
    private modalService: NgbModal,
  ) {
    this.store
      .select((state) => state.session)
      .subscribe((session) => {
        this.session = session.session;
        this.sessionEnded = session.isSessionEnded;
      });
  }

  async ngAfterViewInit() {
    // start the video
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      this.videoAvailable = true;
      this.video.nativeElement.srcObject = stream;
      const box = this.uiHelperService.setBoundingBox(stream);
      console.log('setBoundingBox:box:', box);
      // aspect ratio of the screen and webcam may be different. make calculations easier
      this.updateDimensions(this.video.nativeElement);

      this.startGame();
    } catch (err: any) {
      console.log(err);
      this.noVideoError = err.toString().replace('DOMException:', '');
      this.modalService.open(this.noVideoModal, {
        centered: true,
        keyboard: false,
        backdrop: 'static',
      });
    }
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
    this.coordinationService.start(this.game as Phaser.Game, () => {});
    this.updateDimensions(this.canvas.nativeElement.querySelector('canvas'));
    setTimeout(() => {
      // Start mediapipe
      this.startMediaPipe();
    });
  }

  startMediaPipe() {
    // Start MediaPipe Holistic
    console.log('STARTING MEDIAPIPE');
    setTimeout(() => {
      this.poseService.start(this.video.nativeElement);
    }, 2000); // gives time for things to settle down
  }

  async openSessionCloseModal() {
    this.modalService.open(this.sessionCloseModal, { centered: true });
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

  closeSessionConfirmed() {
    this.analyticsService.sendSessionEndedAt();
    Howler.stop();
    this.sendSessionEndEvent();
  }
  sendSessionEndEvent() {
    window.parent.postMessage(
      {
        patient: { id: this.session?.patient },
        session: { id: this.session?.id },
      },
      '*',
    );
  }

  closeModal() {
    this.modalService.dismissAll();
  }
}

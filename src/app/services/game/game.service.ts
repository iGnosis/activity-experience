import { Injectable } from '@angular/core';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import {
  Activities,
  ActivityBase,
  ActivityConfiguration,
  CalibrationStatusType,
} from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { CalibrationService } from '../calibration/calibration.service';
import { ElementsService } from '../elements/elements.service';
import { PoseService } from '../pose/pose.service';
import { UiHelperService } from '../ui-helper/ui-helper.service';
import { SitToStandService } from './sit-to-stand/sit-to-stand.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  game?: Phaser.Game;
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

  _calibrationStatus: CalibrationStatusType;

  get calibrationStatus() {
    return this._calibrationStatus;
  }

  set calibrationStatus(status: CalibrationStatusType) {
    this._calibrationStatus = status;
    this.elements.score.state = {
      data: { label: 'Calibration Status: ', value: status },
      attributes: {},
    };
  }

  constructor(
    private elements: ElementsService,
    private uiHelperService: UiHelperService,
    private calibrationService: CalibrationService,
    private calibrationScene: CalibrationScene,
    private sitToStandScene: SitToStandScene,
    private sitToStandService: SitToStandService,
    private poseService: PoseService,
  ) {}

  async bootstrap(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      video.srcObject = stream;
      const box = this.uiHelperService.setBoundingBox(stream);
      this.updateDimensions(video);
      await this.setPhaserDimensions(canvas);
      await this.startPoseDetection(video);
      this.startGame();
    } catch (err: any) {
      console.log(err);
    }
  }

  setPhaserDimensions(canvas: HTMLCanvasElement) {
    return new Promise((resolve) => {
      const scenes = this.getScenes();
      this.config.scene = scenes;
      this.game = new Phaser.Game(this.config);
      this.updateDimensions(canvas.querySelector('canvas') as HTMLCanvasElement);
      resolve({});
    });
  }

  startPoseDetection(video: HTMLVideoElement) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.poseService.start(video);
        resolve({});
      }, 1000);
    });
  }

  getScenes() {
    return [this.calibrationScene, this.sitToStandScene];
  }

  getActivities(): { [key in Activities]?: ActivityBase } {
    return {
      'sit-stand-achieve': this.sitToStandService,
      'beat-boxer': this.sitToStandService,
      'sound-slicer': this.sitToStandService,
    };
  }

  setupSubscriptions() {
    this.calibrationService.enable();
    this.calibrationService.result.subscribe((status: any) => {
      this.calibrationStatus = status;
    });
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

  findNextGame(): { name: Activities; settings: ActivityConfiguration } {
    // TODO: Through an API call find out which game needs to be started next.
    // For now, always starting sit.stand.achieve
    return {
      name: 'sit-stand-achieve',
      settings: environment.settings['sit-stand-achieve'],
    };
  }

  async startGame() {
    const nextGame = this.findNextGame();
    const activity = this.getActivities()[nextGame.name];
    if (activity) {
      await this.executeBatch(activity.welcome());
    }
    // Load the welcome screen
    // Calibration, if not already calibrated. calibration service should be managed from here.
    // Check the tutorial conditions and start the tutorial if needed
    // call the preLoop()
    // call the loop()
    // call the postLoop()
    // Load the welcome screen of the next game

    // Each object in the array will be a breakpoint. If something goes wrong, the loop will be started.
    // There should be a global recalibration count and local recalibration count.
    // Whenever the two are different, throw an error to break the function and the loop.

    // const items = await this.sitToStandService.preLoop();
  }

  async executeBatch(batch: Array<() => Promise<any>>) {
    // TODO: Handle recalibration
    return new Promise((resolve, reject) => {
      try {
        console.log(batch);
        batch.forEach(async (item) => {
          await item();
        });
        resolve({});
      } catch (err) {
        reject(err);
      }
    });
  }
}

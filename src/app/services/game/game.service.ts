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
  gameCount = 0;

  _calibrationStatus: CalibrationStatusType;

  get calibrationStatus() {
    return this._calibrationStatus;
  }

  set calibrationStatus(status: CalibrationStatusType) {
    // TODO: Update the time the person stayed calibrated in the stage (and db)
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

  findNextGame(): { name: Activities; settings: ActivityConfiguration } | undefined {
    // TODO: Through an API call find out which game needs to be started next.
    // For now, always starting sit.stand.achieve
    this.gameCount += 1;
    if (this.gameCount <= 1) {
      return {
        name: 'sit-stand-achieve',
        settings: environment.settings['sit-stand-achieve'],
      };
    } else {
      return;
    }
  }

  async startGame() {
    let nextGame = this.findNextGame();
    if (!nextGame) return;
    const activity = this.getActivities()[nextGame.name];
    // TODO: Track the stage under execution, so that if the calibration goes off, we can restart
    // the game at the exact same stage.
    if (activity) {
      await this.executeBatch(activity.welcome());
      // TODO, check if the tutorial needs to run
      await this.executeBatch(activity.tutorial());
      await this.executeBatch(activity.preLoop());
      // TODO, run the loop function for the required number of reps (based on the settings)
      // Store the number of reps completed in the game state (and server)
      await this.executeBatch(activity.loop());
      await this.executeBatch(activity.postLoop());
    }
    // If more games available, start the next game.
    nextGame = this.findNextGame();
    if (nextGame) {
      this.startGame();
    }

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

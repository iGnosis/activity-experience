import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import {
  Activities,
  ActivityBase,
  ActivityConfiguration,
  CalibrationStatusType,
  Genre,
  HandTrackerStatus,
} from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { CalibrationService } from '../calibration/calibration.service';
import { ElementsService } from '../elements/elements.service';
import { GameStateService } from '../game-state/game-state.service';
import { PoseService } from '../pose/pose.service';
import { UiHelperService } from '../ui-helper/ui-helper.service';
import { SitToStandService } from './sit-to-stand/sit-to-stand.service';
import { game } from '../../store/actions/game.actions';
import { HandTrackerService } from '../classifiers/hand-tracker/hand-tracker.service';
import { CheckinService } from '../checkin/checkin.service';

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
  gamesCompleted: Array<Activities> = [];
  reCalibrationCount = 0;
  _calibrationStatus: CalibrationStatusType;
  gameStatus = {
    stage: 'welcome',
    breakpoint: 0,
  };

  get calibrationStatus() {
    return this._calibrationStatus;
  }

  set calibrationStatus(status: CalibrationStatusType) {
    // TODO: Update the time the person stayed calibrated in the stage (and db)
    console.log(status);
    this._calibrationStatus = status;
    if (status === 'error') {
      this.calibrationService.startCalibrationScene(this.game as Phaser.Game);
    } else if (status === 'success') {
      this.startGame();
    }
  }

  constructor(
    private elements: ElementsService,
    private uiHelperService: UiHelperService,
    private calibrationService: CalibrationService,
    private handTrackerService: HandTrackerService,
    private calibrationScene: CalibrationScene,
    private sitToStandScene: SitToStandScene,
    private sitToStandService: SitToStandService,
    private poseService: PoseService,
    private store: Store,
    private gameStateService: GameStateService,
    private checkinService: CheckinService,
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
      this.setupSubscriptions();
      this.startCalibration();
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
      sit_stand_achieve: this.sitToStandService,
      beat_boxer: this.sitToStandService,
      sound_slicer: this.sitToStandService,
    };
  }

  setupSubscriptions() {
    this.calibrationService.enable();
    this.calibrationService.result.subscribe((status: any) => {
      this.calibrationStatus = status;
    });
    this.calibrationService.reCalibrationCount.subscribe((count: number) => {
      this.reCalibrationCount = count;
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
    if (this.gamesCompleted.indexOf('sit_stand_achieve') === -1) {
      // If the person has not played sit2stand yet.
      return {
        name: 'sit_stand_achieve',
        settings: environment.settings['sit_stand_achieve'],
      };
    } else {
      return;
    }
  }

  getRemainingStages() {
    const allStages = ['welcome', 'tutorial', 'preLoop', 'loop', 'postLoop'];
    return allStages.splice(allStages.indexOf(this.gameStatus.stage), allStages.length);
  }

  async startGame() {
    const reCalibrationCount = this.reCalibrationCount;
    let nextGame = this.findNextGame();
    if (!nextGame) return;

    const activity = this.getActivities()[nextGame.name];
    const remainingStages = this.getRemainingStages();
    console.log('remainingStages', remainingStages);

    // TODO: Track the stage under execution, so that if the calibration goes off, we can restart
    // the game at the exact same stage.
    if (activity) {
      try {
        const response = await this.gameStateService.newGame(nextGame.name).catch((err) => {
          console.log(err);
        });
        if (response && response.data) {
          this.store.dispatch(game.newGame(response.data.insert_game_one));
        }
        // get genre
        this.checkinService.getUserGenre();
      } catch (err) {
        console.log(err);
      }

      for (let i = 0; i < remainingStages.length; i++) {
        if (reCalibrationCount !== this.reCalibrationCount) {
          throw new Error('Re-calibration occurred');
        }

        if (remainingStages[i] === this.gameStatus.stage) {
          this.gameStatus = {
            stage: remainingStages[i],
            breakpoint: this.gameStatus.breakpoint,
          };
        } else {
          this.gameStatus = {
            stage: remainingStages[i],
            breakpoint: 0,
          };
        }

        await this.executeBatch(
          reCalibrationCount,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          activity[remainingStages[i]](reCalibrationCount),
        );
      }
      // await this.executeBatch(reCalibrationCount, activity['welcome']());
      // // TODO, check if the tutorial needs to run
      // await this.executeBatch(reCalibrationCount, activity.tutorial());
      // await this.executeBatch(reCalibrationCount, activity.preLoop());
      // // TODO, run the loop function for the required number of reps (based on the settings)
      // // Store the number of reps completed in the game state (and server)
      // await this.executeBatch(reCalibrationCount, activity.loop());
      // await this.executeBatch(reCalibrationCount, activity.postLoop());
      this.gamesCompleted.push(nextGame.name);
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

  async startCalibration() {
    // TODO: Start the calibration process.
    this.calibrationService.startCalibrationScene(this.game as Phaser.Game);
  }

  async executeBatch(
    reCalibrationCount: number,
    batch: Array<(reCalibrationCount: number) => Promise<any>>,
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        for (let i = this.gameStatus.breakpoint; i < batch.length; i++) {
          if (this.reCalibrationCount !== reCalibrationCount) {
            reject('Recalibration count changed');
            throw new Error('Recalibration count changed');
            // TODO save the index of the current item in the batch.
          }
          this.gameStatus.breakpoint = i;
          console.log(
            'Updated breakpoint (reCalibrationCount)',
            reCalibrationCount,
            this.gameStatus.stage,
            this.gameStatus.breakpoint,
          );

          await batch[i](this.reCalibrationCount);
        }
        resolve({});
      } catch (err) {
        reject(err);
      }
    });
  }
}

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
import { JwtService } from '../jwt/jwt.service';
import { TtsService } from '../tts/tts.service';
import { SoundsService } from '../sounds/sounds.service';
import { BeatBoxerService } from './beat-boxer/beat-boxer.service';
import { BeatBoxerScene } from 'src/app/scenes/beat-boxer/beat-boxer.scene';
import { debounceTime } from 'rxjs';

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
  private gameStatus = {
    stage: 'welcome',
    breakpoint: 0,
  };

  get calibrationStatus() {
    return this._calibrationStatus;
  }

  set calibrationStatus(status: CalibrationStatusType) {
    // TODO: Update the time the person stayed calibrated in the stage (and db)
    this.setReclibrationCountForElements();
    this._calibrationStatus = status;
    if (status === 'error') {
      this.calibrationService.startCalibrationScene(this.game as Phaser.Game);
      this.soundsService.stopAllAudio();
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
    private beatBoxerScene: BeatBoxerScene,
    private sitToStandService: SitToStandService,
    private soundsService: SoundsService,
    private beatBoxerService: BeatBoxerService,
    private poseService: PoseService,
    private store: Store,
    private gameStateService: GameStateService,
    private checkinService: CheckinService,
    private jwtService: JwtService,
    private ttsService: TtsService,
  ) {
    this.store
      .select((state: any) => state.game)
      .subscribe((game) => {
        if (game.id) {
          // Update the game state whenever redux state changes
          const { id, ...gameState } = game;
          this.gameStateService.updateGame(id, gameState);
        }
      });
  }

  async bootstrap(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.checkAuth();
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
      this.startCalibration();
    } catch (err: any) {
      console.log(err);
    }
  }

  checkAuth() {
    window.parent.postMessage(
      {
        type: 'check-auth',
        token: this.jwtService.getToken(),
      },
      '*',
    );
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
    return [this.calibrationScene, this.sitToStandScene, this.beatBoxerScene];
  }

  getActivities(): { [key in Activities]?: ActivityBase } {
    return {
      sit_stand_achieve: this.sitToStandService,
      beat_boxer: this.beatBoxerService,
      sound_slicer: this.sitToStandService,
    };
  }

  setupSubscriptions() {
    this.calibrationService.enable();
    this.calibrationService.result.pipe(debounceTime(2000)).subscribe((status: any) => {
      this.calibrationStatus = status;
      if (this.calibrationStatus === 'success') {
        if (this.elements.timer.data.mode === 'pause') {
          this.elements.timer.data = {
            mode: 'resume',
          };
        }
        this.elements.guide.data = {
          showIndefinitely: false,
        };
      }
      if (this.calibrationStatus === 'error') {
        this.elements.timer.data = {
          mode: 'pause',
        };
        this.ttsService.tts('To resume the game, please get yourself within the red box.');
        this.elements.guide.data = {
          title: 'To resume the game, please get yourself within the red box.',
          showIndefinitely: true,
        };
      }
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

  async findNextGame(): Promise<{ name: Activities; settings: ActivityConfiguration } | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastGame = await this.checkinService.getLastGame(today.toISOString());

    if (!lastGame || !lastGame.length) {
      if (this.gamesCompleted.indexOf('sit_stand_achieve') === -1) {
        // If the person has not played sit2stand yet.
        return {
          name: 'sit_stand_achieve',
          settings: environment.settings['sit_stand_achieve'],
        };
      } else {
        return;
      }
    } else {
      const idxOfLastGame = environment.order.indexOf(lastGame[0].game);

      let nextGame;
      if (idxOfLastGame === environment.order.length - 1) {
        nextGame = environment.order[0];
      } else {
        nextGame = environment.order[idxOfLastGame + 1];
      }

      // //reset the game status to welcome screen
      // this.gameStatus = {
      //   stage: 'welcome',
      //   breakpoint: 0,
      // };

      return {
        name: nextGame,
        settings: environment.settings[nextGame],
      };
    }
  }

  async getRemainingStages(nextGame: string) {
    const allStages = ['welcome', 'tutorial', 'preLoop', 'loop', 'postLoop'];
    // Todo: uncomment this to enable the tutorial
    const onboardingStatus = await this.checkinService.getOnboardingStatus();
    if (
      onboardingStatus &&
      onboardingStatus.length > 0 &&
      onboardingStatus[0].onboardingStatus &&
      nextGame in onboardingStatus[0].onboardingStatus
    ) {
      allStages.splice(1, 1);
    }
    return allStages.splice(allStages.indexOf(this.gameStatus.stage), allStages.length);
  }

  async startGame() {
    const reCalibrationCount = this.reCalibrationCount;
    let nextGame = await this.findNextGame();
    if (!nextGame) return;

    const activity = this.getActivities()[nextGame.name];
    const remainingStages = await this.getRemainingStages(nextGame.name);
    console.log('remainingStages', remainingStages);

    // TODO: Track the stage under execution, so that if the calibration goes off, we can restart
    // the game at the exact same stage.
    if (activity) {
      try {
        const response = await this.gameStateService.newGame(nextGame.name).catch((err) => {
          console.log(err);
        });
        if (response && response.insert_game_one) {
          console.log('newGame:response.insert_game_one:', response.insert_game_one);
          this.store.dispatch(game.newGame(response.insert_game_one));
        }
        // get genre
        this.checkinService.getUserGenre();
      } catch (err) {
        console.log(err);
      }

      for (let i = 0; i < remainingStages.length; i++) {
        if (reCalibrationCount !== this.reCalibrationCount) {
          return;
          // throw new Error('Re-calibration occurred');
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
      this.store.dispatch(game.gameCompleted());
      this.gamesCompleted.push(nextGame.name);
    }
    // If more games available, start the next game.
    nextGame = await this.findNextGame();
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
    this.ttsService.tts('To start, please get yourself within the red box.');
    this.elements.guide.state = {
      attributes: {
        visibility: 'visible',
      },
      data: {
        title: 'To start, please get yourself within the red box.',
        showIndefinitely: true,
      },
    };
    this.calibrationService.startCalibrationScene(this.game as Phaser.Game);
    // Adding 5 seconds delay to allow the person to see the calibration box
    // Even if they are already calibrated.
    await this.sleep(5000);
    this.setupSubscriptions();
  }

  async sleep(timeout: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    });
  }

  async executeBatch(
    reCalibrationCount: number,
    batch: Array<(reCalibrationCount: number) => Promise<any>>,
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('breakpoint', this.gameStatus);

        for (let i = this.gameStatus.breakpoint; i < batch.length; i++) {
          if (this.reCalibrationCount !== reCalibrationCount) {
            reject('Recalibration count changed');
            // return;
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

  async setReclibrationCountForElements() {
    Object.keys(this.elements).forEach((key) => {
      if (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.elements[key] &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.elements[key].attributes
      ) {
        // alert(this.reCalibrationCount);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.elements[key].attributes.reCalibrationCount = this.reCalibrationCount;
      }
    });
  }
}

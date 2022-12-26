import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import {
  Activities,
  ActivityBase,
  ActivityConfiguration,
  ActivityStage,
  CalibrationStatusType,
  GameState,
  GameStatus,
  PreferenceState,
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
import { ApiService } from '../checkin/api.service';
import { JwtService } from '../jwt/jwt.service';
import { TtsService } from '../tts/tts.service';
import { SoundsService } from '../sounds/sounds.service';
import { BeatBoxerService } from './beat-boxer/beat-boxer.service';
import { BeatBoxerScene } from 'src/app/scenes/beat-boxer/beat-boxer.scene';
import { combineLatest, combineLatestWith, debounceTime, take, throttleTime } from 'rxjs';
import { SoundExplorerService } from './sound-explorer/sound-explorer.service';
import { SoundExplorerScene } from 'src/app/scenes/sound-explorer/sound-explorer.scene';
import { GoogleAnalyticsService } from '../google-analytics/google-analytics.service';
import { MovingTonesService } from './moving-tones/moving-tones.service';
import { MovingTonesScene } from 'src/app/scenes/moving-tones/moving-tones.scene';
import { BenchmarkService } from '../benchmark/benchmark.service';
import { HandsService } from '../hands/hands.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  game?: Phaser.Game;
  benchmarkId?: string | null;
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
        // debug: true,
        // debugShowBody: true,
        // debugShowVelocity: true,
        gravity: { y: 200 },
      },
    },
  };
  gameCount = 0;
  gamesCompleted: Array<Activities> = [];
  reCalibrationCount = 0;
  _calibrationStatus: CalibrationStatusType;
  calibrationStartTime: Date;
  isNewGame = false;
  currentGame?: Activities;
  private gameStatus: GameStatus = {
    stage: 'welcome',
    breakpoint: 0,
    game: 'sit_stand_achieve',
  };
  private poseTrackerWorker: Worker;

  get calibrationStatus() {
    return this._calibrationStatus;
  }

  set calibrationStatus(status: CalibrationStatusType) {
    // TODO: Update the time the person stayed calibrated in the stage (and db)
    this.setReclibrationCountForElements();
    this._calibrationStatus = status;
    if (status === 'error') {
      this.calibrationService.startCalibrationScene(this.game as Phaser.Game);
    } else if (status === 'success') {
      if (this.gameStatus.stage === 'loop') {
        this.handTrackerService.waitUntilHandRaised('any-hand').then(() => {
          this.soundsService.playCalibrationSound('success');
          if (this.elements.timer.data.mode === 'pause') {
            this.elements.timer.data = {
              mode: 'resume',
            };
          }
          if (this.benchmarkId) {
            this.benchmarkService.benchmark(this.benchmarkId).then((result: any) => {
              window.parent.postMessage(
                {
                  type: 'end-game',
                  ...result,
                },
                '*',
              );
            });
          } else {
            this.startGame();
          }
        });
      }
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
    private soundExplorerScene: SoundExplorerScene,
    private movingTonesScene: MovingTonesScene,
    private sitToStandService: SitToStandService,
    private soundsService: SoundsService,
    private beatBoxerService: BeatBoxerService,
    private soundExplorerService: SoundExplorerService,
    private movingTonesService: MovingTonesService,
    private poseService: PoseService,
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private gameStateService: GameStateService,
    private apiService: ApiService,
    private jwtService: JwtService,
    private ttsService: TtsService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private benchmarkService: BenchmarkService,
    private handsService: HandsService,
  ) {
    window.onbeforeunload = () => {
      if (this.poseTrackerWorker) this.poseTrackerWorker.terminate();
      return false;
    };
    this.handTrackerService.enable();
    this.store
      .select((state) => state.game)
      .subscribe((game) => {
        if (game && game.id) {
          // use a specific query to update analytics -- since analytics are stored as JSONB array
          if (game.analytics) {
            // game.analytics[0] is an ugly-workaround - there will always an array of length 1
            this.apiService.updateAnalytics(game.id, game.analytics[0]);
          }

          // generic update query for fields which aren't JSONB
          else {
            const { id, ...gameState } = game;
            this.apiService.updateGame(id, gameState);
          }
        }
      });
  }

  setGame(name: Activities) {
    this.isNewGame = false;
    this.gameStatus = {
      stage: 'welcome',
      breakpoint: 0,
      game: name,
    };
    this.currentGame = name;
  }

  async bootstrap(video: HTMLVideoElement, canvas: HTMLCanvasElement, benchmarkId?: string) {
    this.checkAuth();
    this.benchmarkId = benchmarkId;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (this.benchmarkId) {
        this.benchmarkService.setVideo(video);

        const config = await this.apiService.getBenchmarkConfig(this.benchmarkId);
        if (config && config.rawVideoUrl)
          await this.benchmarkService.loadRawVideo(config.rawVideoUrl);
      } else {
        video.srcObject = stream;
        video.muted = true;
        video.autoplay = true;
      }

      const videoTracks = stream.getTracks();
      if (Array.isArray(videoTracks) && videoTracks.length > 0) {
        const track = videoTracks[0];
        const streamWidth = track.getSettings().width || 0;
        const streamHeight = track.getSettings().height || 0;

        this.uiHelperService.setBoundingBox(streamWidth, streamHeight, {
          innerHeight: window.innerHeight,
          innerWidth: window.innerWidth,
        });
      }

      combineLatest([
        this.poseService.getMediapipeStatus(),
        this.handsService.getMediapipeStatus(),
      ]).subscribe({
        next: async (res) => {
          console.log('this.poseService.getMediapipeStatus:res', res);
          if (res[0].isMediaPipeReady && res[1].isHandsModelReady) {
            await this.setPhaserDimensions(canvas);
            this.startCalibration();
            this.elements.banner.state.attributes.visibility = 'hidden';
          } else {
            this.elements.banner.state = {
              attributes: {
                visibility: 'visible',
                reCalibrationCount: -1,
              },
              data: {
                type: 'loader',
                htmlStr: `
                <div class="w-full h-full d-flex flex-column justify-content-center align-items-center px-10">
                  <h1 class="pt-4 display-3">Starting Session</h1>
                  <h3 class="pt-8 pb-4">Downloading files for a smooth experience.<br>Take a few deep breaths and we should be ready.</h3>
                </div>
                `,
                buttons: [
                  {
                    infiniteProgress: true,
                  },
                ],
              },
            };

            if (res[0].downloadSource == 'cdn' || res[1].downloadSource == 'cdn') {
              this.elements.banner.data.htmlStr = `
                <div class="w-full h-full d-flex flex-column justify-content-center align-items-center px-10">
                  <h1 class="pt-4 display-3">Starting Session</h1>
                  <h3 class="pt-6 pb-4">It's taking longer that usual.<br>Please make sure you have a stable internet connection for the best experience.</h3>
                </div>
              `;
            }
          }
        },
        error: async (err) => {
          this.elements.banner.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount: this.reCalibrationCount,
            },
            data: {
              type: 'status',
              htmlStr: ``,
            },
          };
          for (let i = 5; i >= 0; i--) {
            this.elements.banner.state.data.htmlStr = `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center px-18 position-absolute translate-middle-y top-1/2">
                <img src="assets/images/error.png" class="p-2 h-32 w-32" alt="error" />
                <h1 class="pt-4 display-5 text-nowrap">${err.status}</h1>
                <h3 class="pt-8 pb-8">We ran into an unexpected issue while downloading the files. Please refresh the page to solve this issue</h3>
                <button class="btn btn-primary d-flex justify-content-center align-items-center progress mx-16 text-center"><span>Trying again in... ${i}</span></button>
              </div>
              `;
            await this.elements.sleep(1000);
          }
          this.elements.banner.state.attributes.visibility = 'hidden';
          window.location.reload();
        },
      });

      this.updateDimensions(video);
      await this.startPoseDetection(video);
      await this.startHandDetection(video);

      return 'success';
    } catch (err: any) {
      console.log(err);
      return 'failure';
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
        if (environment.stageName !== 'local') {
          this.startPoseTracker();
        }
        resolve({});
      }, 1000);
    });
  }

  startHandDetection(video: HTMLVideoElement) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.handsService.start(video);
        resolve({});
      }, 1000);
    });
  }

  startPoseTracker() {
    if (typeof Worker !== 'undefined') {
      this.poseTrackerWorker = new Worker(new URL('../../pose-tracker.worker', import.meta.url), {
        type: 'module',
      });
      this.poseTrackerWorker.postMessage({
        type: 'connect',
        websocketEndpoint: environment.websocketEndpoint,
      });

      const poseSubscription = this.poseService
        .getPose()
        .pipe(combineLatestWith(this.calibrationService.result), throttleTime(100))
        .subscribe(([poseResults, calibrationStatus]) => {
          const { poseLandmarks } = poseResults;
          this.store
            .select((store) => store.game)
            .pipe(take(1))
            .subscribe((game) => {
              const { id, endedAt } = game;
              this.poseTrackerWorker.postMessage({
                type: 'update-pose',
                poseLandmarks,
                timestamp: Date.now(),
                userId: localStorage.getItem('patient'),
                gameId: id,
                endedAt,
                calibrationStatus,
              });
            });
        });
      this.poseTrackerWorker.onmessage = ({ data }) => {
        console.log(`pose tracker message: `, data);
      };
    }
  }

  getScenes(): Phaser.Scene[] {
    return [
      this.calibrationScene,
      this.sitToStandScene,
      this.beatBoxerScene,
      this.soundExplorerScene,
      this.movingTonesScene,
    ];
  }

  getActivities(): { [key in Activities]?: ActivityBase } {
    const allowMovingTones = environment.stageName !== 'stage' && environment.stageName !== 'prod';
    return {
      sit_stand_achieve: this.sitToStandService,
      beat_boxer: this.beatBoxerService,
      sound_explorer: this.soundExplorerService,
      ...(allowMovingTones ? { moving_tones: this.movingTonesService } : {}),
    };
  }

  setupSubscriptions() {
    this.calibrationService.enable();
    this.calibrationService.result.pipe(debounceTime(2000)).subscribe(async (status: any) => {
      this.calibrationStatus = status;
      if (this.calibrationStatus === 'success') {
        if (this.gameStatus.stage === 'loop') {
          this.ttsService.tts('Now I can see you again.');
          await this.elements.sleep(3000);
          this.ttsService.tts('Please raise one of your hands to continue.');
          this.elements.guide.state = {
            data: {
              title: 'Please raise one of your hands to continue.',
              showIndefinitely: true,
            },
            attributes: {
              visibility: 'visible',
            },
          };
          await this.elements.sleep(3000);
          this.elements.guide.attributes = {
            visibility: 'hidden',
          };
          this.elements.guide.data = {
            showIndefinitely: false,
          };
          this.calibrationStartTime = new Date();
        } else {
          if (this.benchmarkId) {
            this.benchmarkService.benchmark(this.benchmarkId).then((result: any) => {
              window.parent.postMessage(
                {
                  type: 'end-game',
                  ...result,
                },
                '*',
              );
            });
          } else {
            this.startGame();
          }
        }
      }
      if (this.calibrationStatus === 'error') {
        if (this.calibrationStartTime) this.updateCalibrationDuration();
        this.elements.timer.data = {
          mode: 'pause',
        };
        this.ttsService.tts(
          'To resume the game, please get your whole body, from head to toe, within the red box.',
        );
        this.elements.guide.state = {
          data: {
            title: 'Ensure your whole body is in the red box to continue.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
          },
        };
      }
    });
    this.calibrationService.reCalibrationCount.subscribe((count: number) => {
      this.reCalibrationCount = count;
    });
  }

  updateCalibrationDuration() {
    const calibrationEndTime = new Date();
    const timeDiff = Math.abs(calibrationEndTime.getTime() - this.calibrationStartTime.getTime());
    const calibrationDuration = Math.ceil(timeDiff / 1000);
    console.log('calibrationDuration: ', calibrationDuration);
    this.store.dispatch(game.setCalibrationDuration({ calibrationDuration }));
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
    // will be called in two cases...
    // once one game is finished
    // second when the user is calibrated (again)
    if (this.currentGame) {
      // for testing
      const game = this.currentGame || 'sit_stand_achieve';
      const settings = await this.apiService.getGameSettings(game);
      this.currentGame = undefined;
      return {
        name: game,
        settings: settings ? settings.settings : environment.settings[game],
      };
    }
    const lastGame = await this.apiService.getLastGame();

    if (!lastGame || !lastGame.length) {
      // No game played today...Play first game as per config.
      console.log('no game played today. returning the first game as per config.');
      const settings = await this.apiService.getGameSettings(environment.order[0]);
      console.log('getGameSettings:settings:', settings);
      if (!settings) {
        return {
          name: environment.order[0],
          settings: environment.settings[environment.order[0]],
        };
      }
      return {
        name: environment.order[0],
        settings: settings.settings,
      };
    }

    const lastGameIndex = environment.order.indexOf(lastGame[0].game);
    // last played game ended, return next game
    let nextGameIndex = (lastGameIndex + 1) % environment.order.length;
    const lastPlayedGame = await this.apiService.getLastPlayedGame();

    if (!lastPlayedGame[0].endedAt) {
      const lastGameIndex = environment.order.indexOf(lastPlayedGame[0].game);
      // game not ended, return the same game
      nextGameIndex = lastGameIndex;
    }
    const nextGame = environment.order[nextGameIndex];
    const settings = await this.apiService.getGameSettings(nextGame);
    console.log('getGameSettings:settings:', settings);
    if (!settings) {
      return {
        name: nextGame,
        settings: environment.settings[nextGame],
      };
    }
    return {
      name: nextGame,
      settings: settings.settings,
    };
  }

  async getRemainingStages(nextGame: string): Promise<ActivityStage[]> {
    let allStages: Array<ActivityStage> = ['welcome', 'tutorial', 'preLoop', 'loop', 'postLoop'];
    const onboardingStatus = await this.apiService.getOnboardingStatus();
    if (onboardingStatus && onboardingStatus[0]?.onboardingStatus[nextGame]) {
      allStages = allStages.filter((stage) => stage !== 'tutorial');
    }
    return allStages.slice(allStages.indexOf(this.gameStatus.stage), allStages.length);
  }

  async startGame() {
    const reCalibrationCount = this.reCalibrationCount;
    let nextGame = await this.findNextGame();
    if (!nextGame) {
      alert('game over');
      return;
    }

    const activity = this.getActivities()[nextGame.name];
    const remainingStages = await this.getRemainingStages(nextGame.name);
    console.log('remainingStages', remainingStages);

    // TODO: Track the stage under execution, so that if the calibration goes off, we can restart
    // the game at the exact same stage.
    if (activity) {
      try {
        // get genre
        this.apiService.getUserGenre();
      } catch (err) {
        console.log(err);
      }

      for (let i = 0; i < remainingStages.length; i++) {
        if (reCalibrationCount !== this.reCalibrationCount) {
          return;
          // throw new Error('Re-calibration occurred');
        }
        if (remainingStages[i] === 'welcome' && !this.isNewGame) {
          const response = await this.apiService.newGame(nextGame.name).catch((err) => {
            console.log(err);
          });
          if (response && response.insert_game_one) {
            this.isNewGame = true;
            // will update the calibration duration before starting the next game
            // Todo: update calibration duration after the game ends
            if (this.calibrationStartTime) this.updateCalibrationDuration();
            console.log('newGame:response.insert_game_one:', response.insert_game_one);
            this.store.dispatch(game.newGame(response.insert_game_one));
            this.googleAnalyticsService.sendEvent('level_start', {
              level_name: nextGame.name,
            });
            this.googleAnalyticsService.sendEvent('stage_start', {
              name: remainingStages[i],
            });
          }
        }

        if (remainingStages[i] === this.gameStatus.stage) {
          this.gameStatus = {
            stage: remainingStages[i],
            breakpoint: this.gameStatus.breakpoint,
            game: nextGame.name,
          };
        } else {
          if (i !== 0) {
            this.googleAnalyticsService.sendEvent('stage_end', {
              name: remainingStages[i - 1],
            });
          }
          this.googleAnalyticsService.sendEvent('stage_start', {
            name: remainingStages[i],
          });
          this.gameStatus = {
            stage: remainingStages[i],
            breakpoint: 0,
            game: nextGame.name,
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
      this.isNewGame = false;
      this.store.dispatch(game.gameCompleted());
      this.googleAnalyticsService.sendEvent('level_end', {
        level_name: nextGame.name,
      });
      this.gamesCompleted.push(nextGame.name);
      this.gameStateService.postLoopHook();
      console.log('game.service:gameCompleted:', nextGame.name);
    }
    // If more games available, start the next game.
    nextGame = await this.findNextGame();
    if (nextGame) {
      this.gameStatus = {
        stage: 'welcome',
        breakpoint: 0,
        game: nextGame.name,
      };
      if (!this.benchmarkId) this.startGame();
    }

    // Each object in the array will be a breakpoint. If something goes wrong, the loop will be started.
    // There should be a global recalibration count and local recalibration count.
    // Whenever the two are different, throw an error to break the function and the loop.

    // const items = await this.sitToStandService.preLoop();
  }

  async startCalibration() {
    // TODO: Start the calibration process.
    this.ttsService.tts(
      'To start, please get your whole body, from head to toe, within the red box.',
    );
    this.elements.guide.state = {
      data: {
        title: 'Ensure your whole body is in the red box to continue.',
        titleDuration: 3000,
      },
      attributes: {
        visibility: 'visible',
      },
    };
    this.calibrationService.startCalibrationScene(this.game as Phaser.Game);
    // Adding 5 seconds delay to allow the person to see the calibration box
    // Even if they are already calibrated.
    await this.sleep(5000);
    this.calibrationStartTime = new Date();
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
            if (this.calibrationStartTime) this.updateCalibrationDuration();

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

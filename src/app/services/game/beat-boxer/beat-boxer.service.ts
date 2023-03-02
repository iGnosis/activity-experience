import { Injectable } from '@angular/core';
import { ElementsService } from '../../elements/elements.service';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { TtsService } from '../../tts/tts.service';
import { ApiService } from '../../checkin/api.service';
import { Store } from '@ngrx/store';
import {
  GameState,
  Genre,
  AnalyticsDTO,
  PreferenceState,
  CenterOfMotion,
  BagType,
} from 'src/app/types/pointmotion';
import { game } from 'src/app/store/actions/game.actions';
import { SoundsService } from '../../sounds/sounds.service';
import { CalibrationService } from '../../calibration/calibration.service';
import { BeatBoxerScene } from 'src/app/scenes/beat-boxer/beat-boxer.scene';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { ActivityHelperService } from '../activity-helper/activity-helper.service';

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerService {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private globalReCalibrationCount: number;
  private bagPositions: CenterOfMotion[] = ['left', 'right'];
  private positiveLevel = [1.35, 1.4]; // right-wrist <---> right side of the screen

  // TODO: this is temporary fix, until we have levels for each of the objects.
  private negativeLevel = [0.5]; // left side of the screen  <---> left-wrist
  private bagTypes: BagType[] = ['heavy-red', 'speed-red', 'heavy-blue', 'speed-blue'];
  private analytics: AnalyticsDTO[] = [];

  private gameStartTime: number | null;
  private firstPromptTime: number | null;
  private loopStartTime: number | null;

  private leftBagTimeout: any;
  private rightBagTimeout: any;
  private obstacleTimeout: any;

  private isGameComplete = false;
  private shouldReplay: boolean;

  private getRandomItemFromArray = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };
  private bagsAvailable: {
    left?: undefined | BagType | 'obstacle';
    right?: undefined | BagType | 'obstacle';
  } = {};

  qaGameSettings?: any;
  private gameSettings = environment.settings['beat_boxer'];
  private currentLevel = environment.settings['beat_boxer'].currentLevel;
  private config = {
    gameDuration:
      environment.settings['beat_boxer'].levels[this.currentLevel].configuration.gameDuration,
    speed: environment.settings['beat_boxer'].levels[this.currentLevel].configuration.speed,
  };

  private gameDuration = this.config.gameDuration || 0;
  private totalDuration = this.config.gameDuration || 0;

  private successfulReps = 0;
  private failedReps = 0;
  private totalReps = 0;

  private updateElapsedTime = (elapsedTime: number) => {
    if (elapsedTime >= this.gameDuration!) this.isGameComplete = true;
    this.store.dispatch(game.setTotalElapsedTime({ totalDuration: elapsedTime }));
  };

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private handTrackerService: HandTrackerService,
    private ttsService: TtsService,
    private apiService: ApiService,
    private soundsService: SoundsService,
    private calibrationService: CalibrationService,
    private beatBoxerScene: BeatBoxerScene,
    private activityHelperService: ActivityHelperService,
  ) {
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference && preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.gameSettings.levels[this.currentLevel].configuration.genre = this.genre;
          this.soundsService.loadMusicFiles(this.genre);
        } else {
          this.genre === 'jazz' && this.soundsService.loadMusicFiles('jazz');
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
  }

  async setupConfig() {
    const settings = await this.apiService.getGameSettings('beat_boxer');
    if (settings && settings.settings && settings.settings.currentLevel) {
      this.qaGameSettings = settings.settings.levels[this.currentLevel]?.configuration;
      if (this.qaGameSettings) {
        if (this.qaGameSettings.gameDuration) {
          this.config.gameDuration = this.qaGameSettings.gameDuration;
          this.gameDuration = this.qaGameSettings.gameDuration;
        }
        if (this.qaGameSettings.speed) {
          this.config.speed = this.qaGameSettings.speed;
        }
      }
    }
    this.beatBoxerScene.enable();
    this.beatBoxerScene.scene.start('beatBoxer');
  }

  async setup() {
    await this.setupConfig();
    return new Promise<void>(async (resolve, reject) => {
      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.beatBoxerScene.loadAssets(this.genre);
        this.gameSettings.levels[this.currentLevel].configuration.musicSet =
          this.beatBoxerScene.currentSet;
        console.log('Design Assets and Music files are Loaded!!');
      } catch (err) {
        console.error(err);
        // this.soundExplorerScene.scene.restart();
        reject();
      }
      console.timeEnd('Waiting for assets to Load');
      this.isServiceSetup = true;
      resolve();
    });
  }

  welcome() {
    return [
      async (reCalibrationCount: number) => {
        this.gameStartTime = Date.now();
        if (!this.isServiceSetup) {
          this.elements.banner.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
            data: {
              type: 'loader',
              htmlStr: `
          <div class="w-full h-full d-flex flex-column justify-content-center align-items-center px-10">
            <h1 class="pt-4 display-3">Loading Game...</h1>
            <h3 class="pt-8 pb-4">Please wait while we download the audio and video files for the game. It should take less than a minute.</h3>
          </div>
          `,
              buttons: [
                {
                  title: '',
                  infiniteProgress: true,
                },
              ],
            },
          };
          await this.setup();
        }
        this.elements.banner.state = {
          data: {},
          attributes: {
            reCalibrationCount,
            visibility: 'hidden',
          },
        };
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Raise one of your hands when you're ready to begin.");
        this.elements.guide.state = {
          data: {
            title: "Raise one of your hands when you're ready to start.",
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
      },
      async (reCalibrationCount: number) => {
        // this.ttsService.tts('Some instructions before we start');
        // this.elements.ribbon.state = {
        //   attributes: {
        //     visibility: 'visible',
        //     reCalibrationCount,
        //   },
        //   data: {
        //     titles: ['INSTRUCTIONS'],
        //   },
        // };
        // await this.elements.sleep(2500);
        // this.ttsService.tts(
        //   'For this activity, we will not require a chair. Make sure you have enough space to freely move around as you stand up for this activity.',
        // );
        // this.elements.overlay.state = {
        //   attributes: {
        //     visibility: 'visible',
        //     reCalibrationCount,
        //   },
        //   data: {
        //     cards: [
        //       {
        //         icon: '/assets/images/overlay_icons/no-chair.png',
        //         message: 'No chair required',
        //       },
        //       {
        //         icon: '/assets/images/overlay_icons/space-to-move.png',
        //         message: 'Space to move',
        //       },
        //       {
        //         icon: '/assets/images/overlay_icons/stand-up.png',
        //         message: 'Please stand up',
        //       },
        //     ],
        //     transitionDuration: 2500,
        //   },
        // };
        // await this.elements.sleep(9000);
      },
    ];
  }

  tutorial() {
    return [
      async (reCalibrationCount: number) => {
        this.soundsService.playActivityInstructionSound(this.genre);
        this.ttsService.tts("First, let's begin with a guide to beat boxer");
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['A Guide to Beat Boxer'],
          },
        };
        await this.elements.sleep(4000);
      },
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'The objective of this game is to punch the objects on the screen.',
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('The objective of this game is to punch the objects on the screen.');
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: 'Use your right hand to punch the red bags.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Use your right hand to punch the red bags.');
        await this.elements.sleep(2500);
        this.elements.guide.state = {
          data: {
            title: "Let's try it out.",
            titleDuration: 1500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Let's try it out.");
        await this.elements.sleep(1500);

        // show red bag until user punches it with right hand
        let repCompleted = false;
        while (!repCompleted) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.beatBoxerScene.showBag(
            'right',
            'speed-red',
            this.getRandomItemFromArray(this.positiveLevel),
          );
          const res = await this.beatBoxerScene.waitForCollisionOrTimeout('speed-red');
          console.log('success', res);

          if (res.result === 'success') {
            this.soundsService.playCalibrationSound('success');
            repCompleted = true;
          } else {
            this.ttsService.tts("Let's try that again.");
            this.elements.guide.state = {
              data: {
                title: "Let's try that again.",
                titleDuration: 2500,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
            await this.elements.sleep(2500);
          }
          await this.elements.sleep(1000);
        }

        this.ttsService.tts('Well done.');
        this.elements.guide.state = {
          data: {
            title: 'Well done.',
            titleDuration: 1500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2000);
      },
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'Use your left hand to punch the blue bags.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Use your left hand to punch the blue bags.');
        await this.elements.sleep(2500);
        this.elements.guide.state = {
          data: {
            title: "Let's try it out.",
            titleDuration: 1500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Let's try it out.");
        await this.elements.sleep(1500);

        // show blue bag until user punches it with left hand
        let repCompleted = false;
        while (!repCompleted) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.beatBoxerScene.showBag(
            'left',
            'speed-blue',
            this.getRandomItemFromArray(this.negativeLevel),
          );
          const res = await this.beatBoxerScene.waitForCollisionOrTimeout('speed-blue');

          if (res.result === 'success') {
            this.soundsService.playCalibrationSound('success');
            repCompleted = true;
          } else {
            this.ttsService.tts("Let's try that again.");
            this.elements.guide.state = {
              data: {
                title: "Let's try that again.",
                titleDuration: 2500,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
            await this.elements.sleep(2500);
          }
          await this.elements.sleep(1000);
        }

        this.ttsService.tts('Well done.');
        this.elements.guide.state = {
          data: {
            title: 'Well done.',
            titleDuration: 1500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Avoid punching the caution signs.');
        this.elements.guide.state = {
          data: {
            title: 'Avoid punching the caution signs.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.beatBoxerScene.showBag(
          'left',
          'speed-blue',
          this.getRandomItemFromArray(this.negativeLevel),
        );
        this.beatBoxerScene.showObstacle('right', this.getRandomItemFromArray(this.positiveLevel));

        const rep = await this.beatBoxerScene.waitForCollisionOrTimeout('speed-blue', 'obstacle');
        if (rep.result === 'failure') {
          this.beatBoxerScene.destroyGameObjects('speed-blue');
          this.beatBoxerScene.destroyGameObjects('obstacle');
          this.soundsService.playCalibrationSound('error');
          this.ttsService.tts("I knew you couldn't resist it.");
          this.elements.guide.state = {
            data: {
              title: "I knew you couldn't resist it.",
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(3000);
        } else {
          this.beatBoxerScene.destroyGameObjects('obstacle');
          this.soundsService.playCalibrationSound('success');
          this.ttsService.tts('Well done!');
          this.elements.guide.state = {
            data: {
              title: 'Well done!',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(4000);
        }
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Good job! Looks like you're ready to start the activity.");
        this.elements.guide.state = {
          data: {
            title: "Good job! Looks like you're ready to start the activity.",
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.apiService.updateOnboardingStatus({
          beat_boxer: true,
        });
        await this.elements.sleep(5000);
        this.soundsService.stopActivityInstructionSound(this.genre);
      },
    ];
  }

  preLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Starting Beat Boxer');
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">Next Activity</h2>
              <h1 class="pt-6 display-4">Beat Boxer</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="pt-2">Endurance and Coordination</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Beat Boxer',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(7000);
        this.loopStartTime = Date.now();
        this.ttsService.tts("Raise one of your hands when you're ready to begin.");
        this.elements.guide.state = {
          data: {
            title: "Raise one of your hands when you're ready to start.",
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.firstPromptTime = Date.now();
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(2000);
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Get Ready to Start!'],
            titleDuration: 2000,
            tts: true,
          },
        };
        await this.elements.sleep(3000);
      },
    ];
  }

  async showPrompt(promptDetails: any, promptId: string, reCalibrationCount?: number) {
    if (promptDetails.shouldShowObstacle) {
      if (!this.bagsAvailable.left && this.bagsAvailable.right !== 'obstacle') {
        this.beatBoxerScene.showObstacle('left', promptDetails.leftBagPosition);
        this.bagsAvailable.left = 'obstacle';
      }
      if (!this.bagsAvailable.right && this.bagsAvailable.left !== 'obstacle') {
        this.beatBoxerScene.showObstacle('right', promptDetails.rightBagPosition);
        this.bagsAvailable.right = 'obstacle';
      }
    }
    let bag: BagType;
    if (!this.bagsAvailable.left) {
      bag = promptDetails.leftBagType;
      this.beatBoxerScene.showBag('left', bag, promptDetails.leftBagPosition);
      this.bagsAvailable.left = bag;
    }

    if (!this.bagsAvailable.right) {
      bag = promptDetails.rightBagType;
      this.beatBoxerScene.showBag('right', bag, promptDetails.rightBagPosition);
      this.bagsAvailable.right = bag;
    }
    this.leftBagTimeout = setTimeout(() => {
      this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.left);
      this.bagsAvailable.left = undefined;
    }, this.config.speed);
    this.rightBagTimeout = setTimeout(() => {
      this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.right);
      this.bagsAvailable.right = undefined;
    }, this.config.speed);

    if (this.bagsAvailable.left === 'obstacle') {
      this.obstacleTimeout = setTimeout(() => {
        if (this.bagsAvailable.left === 'obstacle') {
          this.beatBoxerScene.destroyGameObjects('obstacle');
          this.bagsAvailable.left = undefined;
        }
      }, this.config.speed);
    }

    if (this.bagsAvailable.right === 'obstacle') {
      this.obstacleTimeout = setTimeout(() => {
        if (this.bagsAvailable.right === 'obstacle') {
          this.beatBoxerScene.destroyGameObjects('obstacle');
          this.bagsAvailable.right = undefined;
        }
      }, this.config.speed);
    }
    const promptTimestamp = Date.now();

    const rep = await this.beatBoxerScene.waitForCollisionOrTimeout(
      this.bagsAvailable.left,
      this.bagsAvailable.right,
      this.config.speed,
    );

    const resultTimestamp = Date.now();
    this.totalReps++;
    // Todo: replace placeholder values with actual values
    const hasUserInteracted: boolean = rep.result !== undefined;
    const analyticsObj = {
      prompt: {
        id: promptId,
        type: 'bag',
        timestamp: promptTimestamp,
        data: {
          ...promptDetails,
          leftBag: this.bagsAvailable.left,
          rightBag: this.bagsAvailable.right,
        },
      },
      reaction: {
        type: 'punch',
        timestamp: Date.now(),
        startTime: Date.now(),
        completionTimeInMs: hasUserInteracted ? Math.abs(resultTimestamp - promptTimestamp) : null,
      },
      result: {
        type: rep.result || 'failure',
        timestamp: resultTimestamp,
        score: rep.result === 'success' ? 1 : 0,
      },
    };
    if (rep.result === 'success') {
      if (rep.bagType === this.bagsAvailable.left) {
        this.bagsAvailable.left = undefined;
      }
      if (rep.bagType === this.bagsAvailable.right) {
        this.bagsAvailable.right = undefined;
      }
      clearTimeout(this.leftBagTimeout);
      clearTimeout(this.rightBagTimeout);
      this.successfulReps++;
      this.store.dispatch(game.repCompleted({ repsCompleted: this.successfulReps }));
      this.store.dispatch(game.setScore({ score: this.successfulReps }));
      this.elements.score.state = {
        data: {
          label: 'Punches',
          value: this.successfulReps,
        },
        attributes: {
          visibility: 'visible',
          reCalibrationCount,
        },
      };
      this.failedReps = 0;
    } else if (rep.result === 'failure') {
      clearTimeout(this.obstacleTimeout);
      if (rep.bagType === this.bagsAvailable.left) {
        this.bagsAvailable.left = undefined;
      }
      if (rep.bagType === this.bagsAvailable.right) {
        this.bagsAvailable.right = undefined;
      }
      this.failedReps++;
      if (this.failedReps >= 3) {
        this.elements.timer.state = {
          data: {
            mode: 'pause',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2000);
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Right hand for red',
            description: 'Use your right hand to punch the red punching bags.',
            src: 'assets/videos/beat-boxer/red-for-right.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'Remember to use your right hand when you see a red punching bag on the screen.',
        );
        await this.elements.sleep(8000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Left hand for blue',
            description: 'Use your left hand to punch the blue punching bags.',
            src: 'assets/videos/beat-boxer/blue-for-left.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'And when you see a blue punching bag on the screen, use your left hand.',
        );
        await this.elements.sleep(8000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);
        this.elements.timer.state = {
          data: {
            mode: 'resume',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.failedReps = 0;
      }
    } else {
      if (this.bagsAvailable.left) {
        this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.left);
        this.bagsAvailable.left = undefined;
      }
      if (this.bagsAvailable.right) {
        this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.right);
        this.bagsAvailable.right = undefined;
      }
    }
    return { analyticsObj };
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.beatBoxerScene.playBacktrack();
        this.elements.score.state = {
          data: {
            label: 'Punches',
            value: '0',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.elements.timer.state = {
          data: {
            mode: 'start',
            isCountdown: true,
            duration: this.gameDuration! * 1000,
            intermediateFns: {
              [this.gameDuration! - 11]: () => {
                this.ttsService.tts('Last few seconds left.');
                this.elements.guide.state = {
                  data: {
                    title: 'Last few seconds left.',
                    titleDuration: 3000,
                  },
                  attributes: {
                    visibility: 'visible',
                    reCalibrationCount,
                  },
                };
              },
            },
            onPause: this.updateElapsedTime,
            onComplete: this.updateElapsedTime,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);

        const startResult: 'success' | 'failure' = 'success';
        const startPrompt = {
          prompt: {
            id: uuidv4(),
            type: 'start',
            timestamp: Date.now(),
            data: {
              gameStartTime: this.gameStartTime,
              loopStartTime: this.loopStartTime,
              firstPromptTime: this.firstPromptTime,
            },
          },
          reaction: {
            type: 'start',
            timestamp: Date.now(),
            startTime: Date.now(),
            completionTimeInMs: 0,
          },
          result: {
            type: startResult,
            timestamp: Date.now(),
            score: 0,
          },
        };
        this.analytics.push(startPrompt);
        this.store.dispatch(game.pushAnalytics({ analytics: [startPrompt] }));
      },
      async (reCalibrationCount: number) => {
        this.beatBoxerScene.enableMusic();
        // while (this.successfulReps < this.config.minCorrectReps) {
        while (!this.isGameComplete) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }

          const shouldShowObstacle = Math.random() > 0.5;
          const leftBagType = this.getRandomItemFromArray(
            this.bagTypes.filter((bag) => bag !== this.bagsAvailable.right || ''),
          );
          const rightBagType = this.getRandomItemFromArray(
            this.bagTypes.filter((bag) => bag !== this.bagsAvailable.left || ''),
          );
          const leftBagPosition = this.getRandomItemFromArray(this.negativeLevel);
          const rightBagPosition = this.getRandomItemFromArray(this.positiveLevel);

          const promptId = uuidv4();
          const { analyticsObj } = await this.showPrompt(
            {
              shouldShowObstacle,
              leftBagType,
              rightBagType,
              leftBagPosition,
              rightBagPosition,
            },
            promptId,
            reCalibrationCount,
          );
          this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));

          await this.elements.sleep(this.config.speed);
        }
        this.elements.confetti.state = {
          data: {},
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        const highScoreResp = await this.apiService.getHighScore('beat_boxer');
        const highScore = highScoreResp?.length ? highScoreResp[0].repsCompleted : 0;

        const shouldAllowReplay =
          Math.abs(this.successfulReps - highScore) <= 5 || Math.random() < 0.5;

        if (!shouldAllowReplay) return;

        this.ttsService.tts(
          'Raise both your hands if you want to add 30 more seconds to this activity.',
        );
        this.elements.guide.state = {
          data: {
            title: 'Raise both your hands to add 30 seconds.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'action',
            htmlStr: `
              <div class="text-center row">
                <h1 class="pt-4 display-3">Times Up!</h1>
                <h2 class="pb-8 display-6">Want to improve your score?</h2>
                <button class="btn btn-primary d-flex align-items-center progress col mx-16"><span class="m-auto d-inline-block">Add 30 more seconds</span></button>
              <div>
            `,
            buttons: [
              {
                title: 'Continue',
                progressDurationMs: 9000,
              },
            ],
          },
        };
        this.shouldReplay = await this.handTrackerService.replayOrTimeout(10000);
        if (typeof this.qaGameSettings?.extendGameDuration === 'boolean') {
          this.shouldReplay = this.qaGameSettings.extendGameDuration;
        }
        this.gameSettings.levels[this.currentLevel].configuration.extendGameDuration =
          this.shouldReplay;
        this.elements.banner.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        if (this.shouldReplay) {
          this.soundsService.playCalibrationSound('success');

          this.isGameComplete = false;

          this.elements.timer.state = {
            data: {
              mode: 'start',
              isCountdown: true,
              duration: 30_000,
              onPause: this.updateElapsedTime,
              onComplete: this.updateElapsedTime,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.gameDuration = 30;
          this.totalDuration += 30;
        }
      },
      async (reCalibrationCount: number) => {
        if (this.shouldReplay) {
          while (!this.isGameComplete) {
            if (reCalibrationCount !== this.globalReCalibrationCount) {
              throw new Error('reCalibrationCount changed');
            }

            const shouldShowObstacle = Math.random() > 0.5;
            const leftBagType = this.getRandomItemFromArray(
              this.bagTypes.filter((bag) => bag !== this.bagsAvailable.right || ''),
            );
            const rightBagType = this.getRandomItemFromArray(
              this.bagTypes.filter((bag) => bag !== this.bagsAvailable.left || ''),
            );
            const leftBagPosition = this.getRandomItemFromArray(this.negativeLevel);
            const rightBagPosition = this.getRandomItemFromArray(this.positiveLevel);

            const promptId = uuidv4();
            const { analyticsObj } = await this.showPrompt(
              {
                shouldShowObstacle,
                leftBagType,
                rightBagType,
                leftBagPosition,
                rightBagPosition,
              },
              promptId,
              reCalibrationCount,
            );
            this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));

            await this.elements.sleep(this.config.speed);
          }
        }
      },
    ];
  }

  stopGame() {
    this.beatBoxerScene.stopBacktrack();
    this.beatBoxerScene.enableMusic(false);
    this.beatBoxerScene.disable();
    this.beatBoxerScene.scene.stop('beatBoxer');
    this.gameSettings.levels[this.currentLevel].configuration.speed = this.config.speed;
    this.apiService.updateGameSettings('beat_boxer', this.gameSettings);
  }

  postLoop() {
    return [
      // Todo: replace hardcoded values
      async (reCalibrationCount: number) => {
        this.stopGame();
        const achievementRatio = this.successfulReps / this.totalReps;
        if (achievementRatio < 0.25) {
          await this.apiService.updateOnboardingStatus({
            beat_boxer: false,
          });
        }
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        const totalDuration: {
          minutes: string;
          seconds: string;
        } = this.activityHelperService.getDurationForTimer(this.totalDuration);
        const highScore = await this.apiService.getHighScore('beat_boxer');

        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'outro',
            htmlStr: `
          <div class="pl-10 text-start px-14" style="padding-left: 20px;">
            <h1 class="pt-8 display-3">Beat Boxer</h1>
            <h2 class="pt-7">Punches: ${this.successfulReps}</h2>
            <h2 class="pt-5">High Score: ${Math.max(
              highScore.length ? highScore[0].repsCompleted : 0,
              this.successfulReps,
            )} Punches</h2>
            <h2 class="pt-5">Time Completed: ${totalDuration.minutes}:${
              totalDuration.seconds
            } minutes</h2>
          <div>
          `,
            buttons: [
              {
                title: this.activityHelperService.isLastActivity
                  ? 'Back to Homepage'
                  : 'Next Activity',
                progressDurationMs: 8000,
              },
            ],
          },
        };
        await this.elements.sleep(11000);
        this.elements.banner.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(500);
        if (!this.activityHelperService.isLastActivity) {
          this.elements.banner.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
            data: {
              type: 'intro',
              htmlStr: `
              <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
                <h1 class="pt-2">Next Activity</h2>
                <h1 class="pt-6 display-4">Sound Explorer</h1>
                <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
                <h1 class="py-2">Range of Motion and Balance</h2>
              </div>
              `,
              buttons: [
                {
                  title: 'Starting Sound Explorer',
                  progressDurationMs: 5000,
                },
              ],
            },
          };
          await this.elements.sleep(6000);
        }
      },
    ];
  }
}

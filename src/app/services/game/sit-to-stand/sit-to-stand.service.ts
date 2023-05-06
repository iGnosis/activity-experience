import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, take } from 'rxjs';
import {
  ActivityBase,
  AnalyticsDTO,
  GameLevels,
  GameMenuElementState,
  GameState,
  Genre,
  Goal,
  HandTrackerStatus,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { SitToStandService as Sit2StandService } from '../../classifiers/sit-to-stand/sit-to-stand.service';
import { SoundsService } from '../../sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { TtsService } from '../../tts/tts.service';
import { ApiService } from '../../checkin/api.service';
import { CalibrationService } from '../../calibration/calibration.service';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { v4 as uuidv4 } from 'uuid';
import { GameLifecycleService } from '../../game-lifecycle/game-lifecycle.service';
import { GameLifeCycleStages } from 'src/app/types/enum';
import { ActivityHelperService } from '../activity-helper/activity-helper.service';

@Injectable({
  providedIn: 'root',
})
export class SitToStandService implements ActivityBase {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private globalReCalibrationCount: number;

  qaGameSettings?: any;
  // init default config values.
  private gameSettings = environment.settings['sit_stand_achieve'];
  private currentLevel = environment.settings['sit_stand_achieve'].currentLevel;
  private streak = 0;
  private levelUpStreak = 10;
  private shouldLevelUp = false;
  private config = {
    minCorrectReps: this.gameSettings.levels[this.currentLevel].configuration.minCorrectReps,
    speed: this.gameSettings.levels[this.currentLevel].configuration.speed,
  };

  private successfulReps = 0;
  private failedReps = 0;
  private totalReps = 0;

  // private targetReps = this.config.minCorrectReps;
  private totalDuration = 0;

  private shouldReplay = false;

  private gameStartTime: number | null;
  private firstPromptTime: number | null;
  private loopStartTime: number | null;

  private comboStreak = 0;
  private health = 3;
  private score = 0;

  private analytics: AnalyticsDTO[] = [];
  private highScore = 0;
  private maxCombo = 0;

  private selectedGoal: Partial<Goal>;
  private shouldShowTutorial = true;

  /**
   * @description
   * Gets an even/odd random number between min and max.
   * @param min - minimum number (inclusive)
   * @param max - maximum number (inclusive)
   * @param type - 'odd' | 'even' | 'any'
   * @returns number
   */
  private getRandomNumBetween(
    min: number,
    max: number,
    type: 'odd' | 'even' | 'any' = 'any',
  ): number {
    const num = Math.floor(Math.random() * (max - min + 1) + min);
    return type === 'odd'
      ? num % 2 === 0
        ? num + 1
        : num
      : type === 'even'
      ? num % 2 === 0
        ? num
        : num + 1
      : num;
  }

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private handTrackerService: HandTrackerService,
    private sit2StandService: Sit2StandService,
    private sit2StandScene: SitToStandScene,
    private soundsService: SoundsService,
    private ttsService: TtsService,
    private calibrationService: CalibrationService,
    private apiService: ApiService,
    private gameLifeCycleService: GameLifecycleService,
    private activityHelperService: ActivityHelperService,
  ) {
    this.resetVariables();
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference && preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.gameSettings.levels[this.currentLevel].configuration.genre = this.genre;
          this.soundsService.loadMusicFiles(this.genre);
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
  }

  resetVariables() {
    this.isServiceSetup = false;
    this.genre = 'jazz';
    this.globalReCalibrationCount = 0;

    this.qaGameSettings = undefined;
    this.gameSettings = environment.settings['sit_stand_achieve'];
    this.currentLevel = environment.settings['sit_stand_achieve'].currentLevel;
    this.streak = 0;
    this.levelUpStreak = 10;
    this.shouldLevelUp = false;
    this.config = {
      minCorrectReps: this.gameSettings.levels[this.currentLevel].configuration.minCorrectReps,
      speed: this.gameSettings.levels[this.currentLevel].configuration.speed,
    };

    this.successfulReps = 0;
    this.failedReps = 0;
    this.totalReps = 0;

    this.totalDuration = 0;
    this.shouldReplay = false;

    this.gameStartTime = null;
    this.firstPromptTime = null;
    this.loopStartTime = null;

    this.comboStreak = 0;
    this.health = 3;
    this.score = 0;
    this.analytics = [];
    this.highScore = 0;

    this.selectedGoal = {};
    this.shouldShowTutorial = true;
  }

  factors = (num: number): number[] => [...Array(num + 1).keys()].filter((i) => num % i === 0);

  async setupConfig() {
    const settings = await this.apiService.getGameSettings('sit_stand_achieve');
    if (settings && settings.settings && settings.settings.currentLevel) {
      this.gameSettings = settings.settings;
      this.currentLevel = settings.settings.currentLevel;

      this.config.minCorrectReps =
        settings.settings.levels[this.currentLevel].configuration.minCorrectReps;
      this.config.speed = settings.settings.levels[this.currentLevel].configuration.speed;
      console.log('setup::config::', this.config);

      this.qaGameSettings = settings.settings.levels[this.currentLevel]?.configuration;
      if (this.qaGameSettings) {
        if (this.qaGameSettings.minCorrectReps) {
          this.config.minCorrectReps = this.qaGameSettings.minCorrectReps;
        }
        if (this.qaGameSettings.speed) {
          this.config.speed = this.qaGameSettings.speed;
        }
      }
    } else {
      await this.apiService.insertGameSettings('sit_stand_achieve', this.gameSettings);
    }

    this.store.dispatch(
      game.saveGameSettings({ settings: { ...this.config, level: this.currentLevel } }),
    );

    this.highScore = await this.apiService.getHighScoreXP('sit_stand_achieve');

    this.sit2StandService.enable();
  }

  async setup() {
    // setup game config
    await this.setupConfig();
    return new Promise<void>(async (resolve, reject) => {
      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.sit2StandScene.loadAssets(this.genre);
        this.gameSettings.levels[this.currentLevel].configuration.musicSet =
          this.sit2StandScene.currentSet;
        console.log('Design Assets and Music files are Loaded!!');
      } catch (err) {
        console.error(err);
        reject();
      }
      console.timeEnd('Waiting for assets to Load');
      this.isServiceSetup = true;
      resolve();
    });
  }

  welcome() {
    console.log('running welcome');

    return [
      async (reCalibrationCount: number) => {
        // start recording
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
        this.elements.titleBar.state = {
          data: {
            title: 'Sit Stand Achieve',
            xp: this.highScore,
            transitionFrom: 'top',
          },
          attributes: {
            reCalibrationCount,
            visibility: 'visible',
          },
        };
        const goals = await this.apiService.getGameGoals('sit_stand_achieve');
        this.elements.goalSelection.state = {
          data: {
            goals,
          },
          attributes: {
            reCalibrationCount,
            visibility: 'visible',
          },
        };
        this.ttsService.tts('Move your hand to either side to select');
        this.elements.guide.state = {
          data: {
            title: 'Move your hand to either side to select',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.elements.gameMenu.state = {
          data: {
            gesture: undefined,
            hideBgOverlay: true,
            leftTitle: 'Change Goal',
            rightTitle: 'Set Goal',
            holdDuration: 1500,
            position: 'bottom',
          },
          attributes: {
            reCalibrationCount,
            visibility: 'visible',
          },
        };
        await new Promise((resolve) => {
          const handSubscription = this.handTrackerService.sidewaysGestureResult
            .pipe(debounceTime(200), distinctUntilChanged())
            .subscribe((status: HandTrackerStatus) => {
              this.elements.gameMenu.state = {
                data: {
                  gesture: status,
                  hideBgOverlay: true,
                  leftTitle: 'Change Goal',
                  rightTitle: 'Set Goal',
                  holdDuration: 1500,
                  position: 'bottom',
                  onLeft: async () => {
                    this.elements.goalSelection.state = {
                      data: {
                        goals,
                        action: 'change-goal',
                      },
                      attributes: {
                        reCalibrationCount,
                        visibility: 'visible',
                      },
                    };
                  },
                  onRight: async () => {
                    handSubscription.unsubscribe();
                    await new Promise((resolve) => {
                      this.elements.goalSelection.state = {
                        data: {
                          goals,
                          action: 'select-goal',
                          onSelect: async (goal) => {
                            this.selectedGoal = goal;
                            const expiringGoals = goals.reduce((acc: any[], curr) => {
                              if (curr.id && curr.id !== goal.id) {
                                acc.push(curr.id);
                              }
                              return acc;
                            }, []);

                            await this.apiService.selectGoal(goal.id!, expiringGoals);
                          },
                        },
                        attributes: {
                          reCalibrationCount,
                          visibility: 'visible',
                        },
                      };
                      this.elements.gameMenu.hide();
                      this.elements.titleBar.state = {
                        data: {
                          title: 'Your selected goal',
                          transitionFrom: 'bottom',
                        },
                        attributes: {
                          reCalibrationCount,
                          visibility: 'visible',
                        },
                      };
                      setTimeout(() => {
                        this.elements.titleBar.hide();
                        this.elements.goalSelection.hide();
                        resolve({});
                      }, 3000);
                    });
                    resolve({});
                  },
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            });
        });
        this.elements.guide.hide();
        this.elements.sleep(1000);
      },
      async (reCalibrationCount: number) => {
        const gameMenuState: Partial<GameMenuElementState> = {
          hideBgOverlay: false,
          leftTitle: 'Start Tutorial',
          rightTitle: 'Play Game',
          holdDuration: 1500,
          position: 'center',
        };
        this.elements.gameMenu.state = {
          data: {
            ...gameMenuState,
            gesture: undefined,
            onLeft: async () => {
              this.shouldShowTutorial = true;
            },
            onRight: async () => {
              this.shouldShowTutorial = false;
            },
          },
          attributes: {
            reCalibrationCount,
            visibility: 'visible',
          },
        };
        await new Promise((resolve) => {
          const handSubscription = this.handTrackerService.sidewaysGestureResult
            .pipe(debounceTime(200), distinctUntilChanged())
            .subscribe((status: HandTrackerStatus) => {
              this.elements.gameMenu.state = {
                data: {
                  ...gameMenuState,
                  gesture: status,
                  onLeft: async () => {
                    handSubscription.unsubscribe();
                    this.shouldShowTutorial = true;
                    this.elements.gameMenu.hide();
                    resolve({});
                  },
                  onRight: async () => {
                    handSubscription.unsubscribe();
                    this.shouldShowTutorial = false;
                    this.elements.gameMenu.hide();
                    resolve({});
                  },
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            });
        });
      },
      async (reCalibrationCount: number) => {
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['A Guide to Sit, Stand, Achieve'],
          },
        };
        await this.elements.sleep(2500);
      },
      async (reCalibrationCount: number) => {
        this.elements.overlay.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            cards: [
              {
                icon: '/assets/images/overlay_icons/Protect.jpg',
                message: 'Safety above all',
                tts: "Please make sure you're in a safe environment.",
              },
              {
                icon: '/assets/images/overlay_icons/T_Pose.jpg',
                message: 'Space to move',
                tts: "You'll need enough space to freely move.",
              },
              {
                icon: '/assets/images/overlay_icons/Waiting.jpg',
                message: 'Rest if you feel tired',
                tts: 'Take a break if you feel tired.',
              },
            ],
            transitionDuration: 4000,
          },
        };
        await this.elements.sleep(18000);
      },
      async (reCalibrationCount: number) => {
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
              <h1 class="pt-6 display-4">Sit, Stand, Achieve</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="pt-2">Balance and Reaction Time</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Sit, Stand, Achieve',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        this.ttsService.tts('Starting Sit, Stand, Achieve');
        await this.elements.sleep(7000);
      },
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'You will need a chair for this activity.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('You will need a chair for this activity.');
      },
      async (reCalibrationCount: number) => {
        await this.elements.sleep(3000);
        let res = { result: '' };
        this.elements.guide.state = {
          data: {
            title: 'Please sit on the chair to continue.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Please sit on the chair to continue.');
        while (res.result !== 'success') {
          res = await this.sit2StandService.waitForClassChangeOrTimeOut('sit');
        }
      },
    ];
  }

  onboardingByLevel: { [key in GameLevels]: ((reCalibrationCount: number) => Promise<void>)[] } = {
    level1: [
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'This activity is a simple play on the sit to stand exercise.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('This activity is a simple play on the sit to stand exercise');
        await this.elements.sleep(5000);

        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Odd No. = Stand Up',
            description: 'Stand up when you see an odd number on the screen.',
            src: 'assets/videos/sit-to-stand/odd.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'When you see an odd number on your screen. You stand up from your seat.',
        );

        await this.elements.sleep(8000);

        this.elements.guide.hide();
        this.elements.video.hide();

        await this.elements.sleep(1000);

        this.ttsService.tts('Let’s try it out.');
        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        // show random odd number until the user gets it right
        let repCompleted = false;
        while (!repCompleted) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          const randomOddNumber = this.getRandomNumBetween(1, 100, 'odd').toString();

          this.elements.prompt.state = {
            data: {
              value: randomOddNumber,
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts(randomOddNumber);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              isGradient: true,
              startColor: '#fcaf59',
              endColor: '#f47560',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            'stand',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'success') {
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
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Even No. = Sit Down',
            description: 'Sit down when you see an even number on the screen.',
            src: 'assets/videos/sit-to-stand/even.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'When you see an even number on your screen. You sit down on your seat.',
        );
        await this.elements.sleep(8000);

        this.elements.guide.hide();
        this.elements.video.hide();

        await this.elements.sleep(1000);

        this.ttsService.tts('Let’s try it out.');
        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        // show random even number until the user gets it right
        let repCompleted = false;
        while (!repCompleted) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          const randomOddNumber = this.getRandomNumBetween(1, 100, 'even').toString();

          this.elements.prompt.state = {
            data: {
              value: randomOddNumber,
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts(randomOddNumber);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              isGradient: true,
              startColor: '#fcaf59',
              endColor: '#f47560',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            'sit',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'success') {
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
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'If you see two even or odd numbers appear one after the other,',
            description: 'hold the pose until the timer runs out.',
            src: 'assets/videos/sit-to-stand/consecutive.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'If you see two even or odd numbers appear one after the other, hold the pose until the timer runs out.',
        );
        await this.elements.sleep(10000);

        this.elements.guide.hide();
        this.elements.video.hide();

        await this.elements.sleep(1000);

        // show consecutive number until user gets it right
        let correctConsecutiveReps = 0;
        let promptTypeSwitch = true;
        while (correctConsecutiveReps < 2) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          const randomNumber = this.getRandomNumBetween(
            1,
            100,
            promptTypeSwitch ? 'odd' : 'even',
          ).toString();

          this.elements.prompt.state = {
            data: {
              value: randomNumber,
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts(randomNumber);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              isGradient: true,
              startColor: '#fcaf59',
              endColor: '#f47560',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            promptTypeSwitch ? 'stand' : 'sit',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'success') {
            correctConsecutiveReps++;
          } else {
            correctConsecutiveReps = 0;
            promptTypeSwitch = !promptTypeSwitch;
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

        this.elements.guide.state = {
          data: {
            title: "Great job, looks like you're ready to start the activity.",
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Great job, looks like you're ready to start the activity.");
        await this.elements.sleep(5000);
      },
    ],
    level2: [
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'Welcome to Level 2 of Sit to Stand.',
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Welcome to Level 2 of Sit to Stand');
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "I'm going to give you a simple mathematical problem.",
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("I'm going to give you a simple mathematical problem");
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "In this level we'll be doing addition and subtraction.",
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("In this level we'll be doing addition and subtraction");
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Odd No. = Stand Up',
            description: 'Stand up if the answer is an odd number.',
            src: 'assets/videos/sit-to-stand/odd.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Stand up if the answer is an odd number.');

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
            title: 'Even No. = Sit Down',
            description: 'Sit down if the answer is an even number.',
            src: 'assets/videos/sit-to-stand/even.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Sit down if the answer is an even number.');
        await this.elements.sleep(8000);

        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);

        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Let’s try it out.');
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        const promptExpressions = ['4+8', '9-6'];

        for (let i = 0; i < promptExpressions.length; i++) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.elements.prompt.state = {
            data: {
              value: promptExpressions[i],
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const ttsExpression = promptExpressions[i].replace('-', ' minus ').replace('+', ' plus ');
          this.ttsService.tts(ttsExpression);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              isGradient: true,
              startColor: '#fcaf59',
              endColor: '#f47560',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            eval(promptExpressions[i]) % 2 === 0 ? 'sit' : 'stand',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'failure') {
            --i; //repeat current prompt if failure
          }
          await this.elements.sleep(1000);
        }

        this.elements.prompt.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.elements.guide.state = {
          data: {
            title: 'Tutorial Completed.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Tutorial Completed.');
        await this.elements.sleep(3000);
      },
    ],
    level3: [
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'Welcome to Level 3 of Sit to Stand.',
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Welcome to Level 3 of Sit to Stand');
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "I'm going to give you a simple mathematical problem.",
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("I'm going to give you a simple mathematical problem");
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "In this level we'll be doing multiplication and division.",
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("In this level we'll be doing multiplication and division");
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Odd No. = Stand Up',
            description: 'Stand up if the answer is an odd number.',
            src: 'assets/videos/sit-to-stand/odd.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Stand up if the answer is an odd number.');

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
            title: 'Even No. = Sit Down',
            description: 'Sit down if the answer is an even number.',
            src: 'assets/videos/sit-to-stand/even.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Sit down if the answer is an even number.');
        await this.elements.sleep(8000);

        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);

        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Let’s try it out.');
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        const promptExpressions = ['2*8', '9/3'];

        for (let i = 0; i < promptExpressions.length; i++) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.elements.prompt.state = {
            data: {
              value: promptExpressions[i],
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const ttsExpression = promptExpressions[i]
            .replace('*', ' multiplied with ')
            .replace('/', ' divided by ');
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              isGradient: true,
              startColor: '#fcaf59',
              endColor: '#f47560',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            eval(promptExpressions[i]) % 2 === 0 ? 'sit' : 'stand',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'failure') {
            --i; //repeat current prompt if failure
          }
          await this.elements.sleep(1000);
        }

        this.elements.prompt.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.elements.guide.state = {
          data: {
            title: 'Tutorial Completed.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Tutorial Completed.');
        await this.elements.sleep(3000);
      },
    ],
  };

  tutorial() {
    console.log('running tutorial');

    if (!this.shouldShowTutorial) return [];

    return [
      async (reCalibrationCount: number) => {
        this.gameLifeCycleService.enterStage(GameLifeCycleStages.TUTORIAL);
        console.log('current level: ', this.currentLevel);
        this.soundsService.playActivityInstructionSound(this.genre);
        this.elements.guide.state = {
          data: {
            title: "Great, let's begin.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Great, let's begin.");
        await this.elements.sleep(5000);
      },
      ...this.onboardingByLevel[this.currentLevel],
      async () => {
        await this.apiService.updateOnboardingStatus({
          sit_stand_achieve: true,
        });
        this.soundsService.stopActivityInstructionSound(this.genre);
        this.gameLifeCycleService.resetStage(GameLifeCycleStages.TUTORIAL);
      },
    ];
  }

  preLoop() {
    return [];
  }

  async showPrompt(
    promptNum: number,
    promptId: string,
    analytics: any[],
    reCalibrationCount?: number,
    stringExpression?: string,
  ) {
    const promptClass = promptNum % 2 === 0 ? 'sit' : 'stand';

    this.elements.prompt.state = {
      data: {
        value: stringExpression?.replace('*', 'x') || promptNum,
      },
      attributes: {
        visibility: 'visible',
        ...(typeof reCalibrationCount === 'number' && { reCalibrationCount }),
      },
    };
    const promptTimestamp = Date.now();
    const ttsExpression = stringExpression
      ?.replace('-', ' minus ')
      .replace('+', ' plus ')
      .replace('/', ' divided by ')
      .replace('*', ' multiplied with ');

    const backtrack = this.sit2StandScene.getBacktrack(this.genre);
    await this.ttsService.tts(ttsExpression || promptNum.toString(), backtrack);

    this.elements.timeout.state = {
      data: {
        mode: 'start',
        timeout: this.config.speed,
        isGradient: true,
        startColor: '#fcaf59',
        endColor: '#f47560',
      },
      attributes: {
        visibility: 'visible',
        ...(typeof reCalibrationCount === 'number' && { reCalibrationCount }),
      },
    };
    const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
      promptClass,
      this.config.speed,
    );
    const resultTimestamp = Date.now();
    console.log(
      'promptNum: ',
      promptNum,
      'promptClass: ',
      promptClass,
      'patientClass: ',
      res.currentClass,
      'stringExpression: ',
      stringExpression,
      'res: ',
      res,
    );
    this.totalReps += 1;
    this.elements.timeout.state = {
      data: {
        mode: 'stop',
      },
      attributes: {
        visibility: 'hidden',
        ...(typeof reCalibrationCount === 'number' && { reCalibrationCount }),
      },
    };
    const hasUserStateChanged: boolean =
      analytics.length > 0 ? analytics.slice(-1)[0].reaction.type !== res.currentClass : true;
    const analyticsObj: AnalyticsDTO = {
      prompt: {
        id: promptId,
        type: promptClass,
        timestamp: promptTimestamp,
        data: {
          number: promptNum,
          ...(stringExpression ? { stringExpression } : {}),
        },
      },
      reaction: {
        type: res.currentClass,
        timestamp: Date.now(),
        startTime: Date.now(),
        completionTimeInMs: hasUserStateChanged
          ? Math.abs(resultTimestamp - promptTimestamp)
          : null, // milliseconds between reaction and result if user state changed
      },
      result: {
        type: res.result,
        timestamp: resultTimestamp,
        score: res.result === 'success' ? 1 : 0,
        coin: 0,
      },
    };

    return { res, analyticsObj };
  }
  private getRandomPromptExpression() {
    let stringExpression;

    if (this.currentLevel === 'level2') {
      const isSumOperation = Math.random() > 0.5;

      const num1 = this.getRandomNumBetween(1, 9);
      const num2 = isSumOperation
        ? this.getRandomNumBetween(1, 9)
        : this.getRandomNumBetween(1, Math.max(num1 - 1, 1));

      stringExpression = num1 + (isSumOperation ? '+' : '-') + num2;
    } else if (this.currentLevel === 'level3') {
      const isDivisionOperation = Math.random() > 0.5;

      const num1 = this.getRandomNumBetween(1, 9);

      const num1Factors = this.factors(num1);
      const randomFactor =
        num1 === 0 ? 1 : num1Factors[Math.floor(Math.random() * num1Factors.length)];

      const num2 = Math.floor(isDivisionOperation ? randomFactor : this.getRandomNumBetween(1, 9));

      stringExpression = num1 + (isDivisionOperation ? '/' : '*') + num2;
    }
    const promptNum = stringExpression ? eval(stringExpression) : this.getRandomNumBetween(1, 100);

    return { promptNum, stringExpression };
  }

  private async game(reCalibrationCount?: number) {
    this.sit2StandScene.enableMusic();
    while (this.health > 0) {
      if (reCalibrationCount !== this.globalReCalibrationCount) {
        throw new Error('reCalibrationCount changed');
      }
      // generating a prompt number
      const result = this.getRandomPromptExpression();
      let promptNum = result.promptNum;
      let stringExpression = result.stringExpression;

      // checking if not more than two even or two odd in a row.
      if (this.analytics && this.analytics.length >= 2) {
        const prevReps = this.analytics.slice(-2);
        if (prevReps[0].prompt.type === prevReps[1].prompt.type) {
          // if two even or two odd in a row, we generate the opposite class number.
          if (this.currentLevel === 'level1') {
            prevReps[0].prompt.type === 'sit'
              ? (promptNum = this.getRandomNumBetween(1, 100, 'odd'))
              : (promptNum = this.getRandomNumBetween(1, 100, 'even'));
          } else {
            // for level 2 and 3
            if (prevReps[0].prompt.type === 'sit') {
              do {
                const result = this.getRandomPromptExpression();
                promptNum = result.promptNum;
                stringExpression = result.stringExpression;
              } while (promptNum % 2 === 0);
            } else {
              do {
                const result = this.getRandomPromptExpression();
                promptNum = result.promptNum;
                stringExpression = result.stringExpression;
              } while (promptNum % 2 !== 0);
            }
          }
        }
      }
      const promptId = uuidv4();
      const { res, analyticsObj } = await this.showPrompt(
        promptNum,
        promptId,
        this.analytics,
        reCalibrationCount,
        stringExpression,
      );

      if (res.result === 'success') {
        this.comboStreak += 1;

        // get timeout duration and calculate score

        let score = 0;
        if (res.timeoutDuration) {
          if (res.timeoutDuration < 25) {
            score = this.comboStreak * 4;
            this.score += this.comboStreak * 4;

            this.elements.timeout.state = {
              data: {
                mode: 'show_score',
                data: {
                  color: '#67E9F1',
                  text: 'Excellent x4',
                  xpos: res.timeoutDuration + 'vw',
                },
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          } else if (res.timeoutDuration < 50) {
            score = this.comboStreak * 3;
            this.score += this.comboStreak * 3;
            this.elements.timeout.state = {
              data: {
                mode: 'show_score',
                data: {
                  color: '#8CDFB3',
                  text: 'Great x3',
                  xpos: res.timeoutDuration + 'vw',
                },
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          } else if (res.timeoutDuration < 75) {
            score = this.comboStreak * 2;
            this.score += this.comboStreak * 2;
            this.elements.timeout.state = {
              data: {
                mode: 'show_score',
                data: {
                  color: '#DEFFEE',
                  text: 'Good x2',
                  xpos: res.timeoutDuration + 'vw',
                },
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          } else {
            score = this.comboStreak;
            this.score += this.comboStreak;

            this.elements.timeout.state = {
              data: {
                mode: 'show_score',
                data: {
                  color: '#ffff00',
                  text: 'Average x1',
                  xpos: '80vw',
                },
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          }
        } else {
          if (res.isConsecutive) {
            score = this.comboStreak * 2;
            this.score += this.comboStreak * 2;

            this.elements.timeout.state = {
              data: {
                mode: 'show_score',
                data: {
                  color: '#DEFFEE',
                  text: 'Good x2',
                  xpos: '80vw',
                },
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          }
        }
        if (this.score > this.highScore) {
          this.apiService.highScoreReachedEvent('Sit to Stand');
          this.elements.confetti.state = {
            data: {},
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
        }

        this.sit2StandScene.animateScore(score);

        analyticsObj.result.coin = score;
        this.analytics.push(analyticsObj);
        this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));

        if (this.maxCombo < this.comboStreak) {
          this.maxCombo = this.comboStreak;
        }

        this.elements.score.state = {
          data: {
            score: this.score,
            combo: this.comboStreak,
            highScore: this.highScore,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.sit2StandScene.playTrigger(this.genre);
        this.elements.prompt.state = {
          data: {
            repStatus: res.result,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.successfulReps += 1;
        this.failedReps = 0;
        this.store.dispatch(game.repCompleted({ repsCompleted: this.successfulReps }));
        this.elements.score.state = {
          data: {
            score: this.score,
            combo: this.comboStreak,
            highScore: this.highScore,
            position: {
              top: '30%',
              left: '80%',
            },
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        if (++this.streak === this.levelUpStreak) this.shouldLevelUp = true;
      } else {
        this.soundsService.playCalibrationSound('error');

        // reducing health if user fails
        this.health -= 1;
        this.elements.health.state = {
          data: {
            total: 3,
            value: this.health,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        // reset combo
        this.comboStreak = 0;

        this.analytics.push(analyticsObj);
        this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));

        this.elements.prompt.state = {
          data: {
            repStatus: res.result,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.failedReps += 1;
        this.streak = 0;
      }
      await this.elements.sleep(1000);
      this.elements.prompt.state = {
        data: {},
        attributes: {
          visibility: 'hidden',
          reCalibrationCount,
        },
      };
    }
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.loopStartTime = Date.now();
        this.elements.guide.state = {
          data: {
            showIndefinitely: true,
            title: 'Raise one of your hands to start the activity.',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Raise one of your hands to start the activity.');
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.firstPromptTime = Date.now();
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.hide();

        this.elements.ribbon.state = {
          data: {
            titles: ['Get Ready to Start', 'On your mark', 'Get Set', 'Go!'],
            titleDuration: 1500,
            tts: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(9000);
      },
      async (reCalibrationCount: number) => {
        this.sit2StandScene.playBacktrack(this.genre);
        this.elements.score.state = {
          data: {
            score: 0,
            position: {
              top: '30%',
              left: '80%',
            },
            highScore: this.highScore,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.elements.health.state = {
          data: {
            total: 3,
            value: this.health,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        const updateElapsedTime = (elapsedTime: number) => {
          this.totalDuration += elapsedTime;
          this.store.dispatch(game.setTotalElapsedTime({ totalDuration: this.totalDuration }));
        };
        // this.elements.timer.state = {
        //   data: {
        //     mode: 'start',
        //     duration: 60 * 60 * 1000,
        //     onPause: updateElapsedTime,
        //     onComplete: updateElapsedTime,
        //   },
        //   attributes: {
        //     visibility: 'visible',
        //     reCalibrationCount,
        //   },
        // };

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
            coin: 0,
          },
        };
        this.analytics.push(startPrompt);
        this.store.dispatch(game.pushAnalytics({ analytics: [startPrompt] }));
      },
      async (reCalibrationCount: number) => {
        await this.game(reCalibrationCount);
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.elements.score.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        let totalDuration: number | undefined;
        this.store
          .pipe(take(1))
          .subscribe(async (state) => (totalDuration = state.game.totalDuration!));
        const fastestTimeInSecs = await this.apiService.getFastestTime('sit_stand_achieve');

        const shouldAllowReplay =
          Math.abs(fastestTimeInSecs - (totalDuration || 0)) <= 5 || Math.random() < 0.5;

        if (!shouldAllowReplay) return;

        // TODO: remove this replay code, If it's not needed
        // this.ttsService.tts(
        //   'Raise both your hands if you want to add 10 more reps to this activity.',
        // );
        // this.elements.guide.state = {
        //   data: {
        //     title: 'Raise both your hands to add 10 reps.',
        //     showIndefinitely: true,
        //   },
        //   attributes: {
        //     visibility: 'visible',
        //     reCalibrationCount,
        //   },
        // };
        // this.elements.banner.state = {
        //   attributes: {
        //     visibility: 'visible',
        //     reCalibrationCount,
        //   },
        //   data: {
        //     type: 'action',
        //     htmlStr: `
        //       <div class="text-center row">
        //         <h1 class="pt-4 display-3">Times Up!</h1>
        //         <h2 class="pb-8 display-6">Want to improve your score?</h2>
        //         <button class="btn btn-primary d-flex align-items-center progress col mx-16"><span class="m-auto d-inline-block">Add 10 more reps</span></button>
        //       <div>
        //     `,
        //     buttons: [
        //       {
        //         title: 'Continue',
        //         progressDurationMs: 9000,
        //       },
        //     ],
        //   },
        // };
        // this.shouldReplay = await this.handTrackerService.replayOrTimeout(10000);
        // if (typeof this.qaGameSettings?.extendGameDuration === 'boolean') {
        //   this.shouldReplay = this.qaGameSettings.extendGameDuration;
        // }
        // this.elements.banner.attributes = {
        //   visibility: 'hidden',
        //   reCalibrationCount,
        // };
        // this.elements.guide.attributes = {
        //   visibility: 'hidden',
        //   reCalibrationCount,
        // };
        // if (this.shouldReplay) {
        //   this.soundsService.playCalibrationSound('success');

        // this.targetReps! += 10;

        //   const updateElapsedTime = (elapsedTime: number) => {
        //     this.totalDuration += elapsedTime;
        //     this.store.dispatch(game.setTotalElapsedTime({ totalDuration: this.totalDuration }));
        //   };
        //   this.elements.timer.state = {
        //     data: {
        //       mode: 'start',
        //       duration: 60 * 60 * 1000,
        //       onPause: updateElapsedTime,
        //       onComplete: updateElapsedTime,
        //     },
        //     attributes: {
        //       visibility: 'visible',
        //       reCalibrationCount,
        //     },
        //   };
        // }
      },
      async (reCalibrationCount: number) => {
        await this.game(reCalibrationCount);
        // this.elements.timer.state = {
        //   data: {
        //     mode: 'stop',
        //   },
        //   attributes: {
        //     visibility: 'hidden',
        //     reCalibrationCount,
        //   },
        // };
        this.elements.health.hide();
        this.elements.score.hide();
      },
      async (reCalibrationCount: number) => {
        // Todo: Update placeholder value
        const isGoalCompleted = true;
        if (isGoalCompleted) {
          this.elements.titleBar.state = {
            data: {
              title: 'Sit Stand Achieve',
              xp: this.highScore,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.elements.goalSelection.state = {
            data: {
              action: 'completed-goal',
              goals: [this.selectedGoal],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.apiService.setGoalStatus(this.selectedGoal.id!, 'completed');
          await this.elements.sleep(3000);
          this.elements.titleBar.hide();
          this.elements.goalSelection.hide();
        }
      },
    ];
  }

  stopGame() {
    this.sit2StandScene.stopBacktrack(this.genre);
    this.sit2StandScene.enableMusic(false);
    this.apiService.updateGameSettings('sit_stand_achieve', this.gameSettings);
  }

  postLoop() {
    console.log('running Sit,Stand,Achieve postLoop');
    return [
      async (reCalibrationCount: number) => {
        const gameId = this.apiService.gameId;
        if (gameId) {
          await this.apiService.updateMaxCombo(gameId, this.maxCombo);
        }
        this.stopGame();
        // this.soundsService.stopGenreSound();
        const achievementRatio = this.successfulReps / this.totalReps;
        const nextLevel = Number(this.currentLevel.charAt(this.currentLevel.length - 1)) + 1;
        if (achievementRatio < 0.25 || (this.shouldLevelUp && nextLevel <= 3)) {
          await this.apiService.updateOnboardingStatus({
            sit_stand_achieve: false,
          });
        }

        if (this.shouldLevelUp && nextLevel <= 3) {
          this.currentLevel = ('level' + nextLevel) as GameLevels;
          this.gameSettings.currentLevel = this.currentLevel;

          this.elements.guide.state = {
            data: {
              title: "Congratulations, you've progressed to the next level.",
              titleDuration: 5000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts("Congratulations, you've progressed to the next level.");
          await this.elements.sleep(5000);

          this.elements.guide.state = {
            data: {
              title: "Hope you're ready for a new challenge tomorrow.",
              titleDuration: 3000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts("Hope you're ready for a new challenge tomorrow.");
          await this.elements.sleep(3000);
        }
        this.shouldLevelUp = false;

        console.log('updating game settings:', this.gameSettings);
        await this.apiService.updateGameSettings('sit_stand_achieve', this.gameSettings);
      },
    ];
  }
}

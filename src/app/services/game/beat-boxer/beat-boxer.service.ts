import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { BeatBoxerScene } from 'src/app/scenes/beat-boxer/beat-boxer.scene';
import { game } from 'src/app/store/actions/game.actions';
import { GameLifeCycleStages, Metrics } from 'src/app/types/enum';
import {
  AnalyticsDTO,
  Badge,
  BagType,
  BeatBoxerEvent,
  CenterOfMotion,
  GameMenuElementState,
  GameState,
  Genre,
  Goal,
  HandTrackerStatus,
  PreferenceState,
  UserContext,
} from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { CalibrationService } from '../../calibration/calibration.service';
import { ApiService } from '../../checkin/api.service';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { GameLifecycleService } from '../../game-lifecycle/game-lifecycle.service';
import { SoundsService } from '../../sounds/sounds.service';
import { TtsService } from '../../tts/tts.service';
import { ActivityHelperService } from '../activity-helper/activity-helper.service';
import { GoalService } from '../../goal/goal.service';

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerService {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private globalReCalibrationCount: number;
  private bagPositions: CenterOfMotion[] = ['left', 'right'];
  private positiveLevel = [1.35]; // right-wrist <---> right side of the screen

  // TODO: this is temporary fix, until we have levels for each of the objects.
  private negativeLevel = [0.5]; // left side of the screen  <---> left-wrist
  private levelIncrement = 0.0;
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

  private health = 3;
  private score = 0;
  private highScore = 0;
  private combo = 1;
  private comboStreak = 0;
  private maxCombo = 0;
  private scoreSubscription: Subscription;
  private coin = 0;
  private selectedGoal: Partial<Goal>;
  private shouldShowTutorial = true;

  private timeoutMultiplier = (timeout?: number): 1 | 2 | 3 | 4 => {
    if (!timeout) return 1;
    return timeout < 25 ? 4 : timeout < 50 ? 3 : timeout < 75 ? 2 : 1;
  };

  private getTimeoutData = (timeout: number) => {
    if (timeout < 25) {
      return {
        color: '#67E9F1',
        text: 'Excellent x4',
        xpos: timeout + 'vw',
      };
    } else if (timeout < 50) {
      return {
        color: '#8CDFB3',
        text: 'Great x3',
        xpos: timeout + 'vw',
      };
    } else if (timeout < 75) {
      return {
        color: '#DEFFEE',
        text: 'Good x2',
        xpos: timeout + 'vw',
      };
    } else {
      return {
        color: '#ffff00',
        text: 'Average x1',
        xpos: '80vw',
      };
    }
  };

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

  private userContext!: UserContext;
  private badgesUnlocked: Partial<Badge>[] = [];
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
    private gameLifeCycleService: GameLifecycleService,
    private goalService: GoalService,
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
        } else {
          this.genre === 'jazz' && this.soundsService.loadMusicFiles('jazz');
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });

    const patientId = localStorage.getItem('patient')!;
    this.goalService
      .getUserContext(patientId)
      .then((userContext: UserContext) => {
        this.userContext = userContext;
      })
      .catch((err) => {
        console.log('Error while getting user context::, ', err);
        this.userContext = {};
      });
  }

  resetVariables() {
    this.isServiceSetup = false;
    this.genre = 'jazz';
    this.bagPositions = ['left', 'right'];
    this.positiveLevel = [1.35];
    this.negativeLevel = [0.5];
    this.levelIncrement = 0.0;
    this.bagTypes = ['heavy-red', 'speed-red', 'heavy-blue', 'speed-blue'];
    this.analytics = [];
    this.gameStartTime = null;
    this.firstPromptTime = null;
    this.loopStartTime = null;
    this.leftBagTimeout = undefined;
    this.rightBagTimeout = undefined;
    this.obstacleTimeout = undefined;
    this.isGameComplete = false;
    this.shouldReplay = false;
    this.health = 3;
    this.score = 0;
    this.highScore = 0;
    this.combo = 1;
    this.comboStreak = 0;
    if (this.scoreSubscription) {
      this.scoreSubscription.unsubscribe();
    }
    this.coin = 0;
    this.bagsAvailable = {};
    this.qaGameSettings = undefined;
    this.gameSettings = environment.settings['beat_boxer'];
    this.currentLevel = environment.settings['beat_boxer'].currentLevel;
    this.config = {
      gameDuration:
        environment.settings['beat_boxer'].levels[this.currentLevel].configuration.gameDuration,
      speed: environment.settings['beat_boxer'].levels[this.currentLevel].configuration.speed,
    };
    this.gameDuration = this.config.gameDuration || 0;
    this.totalDuration = this.config.gameDuration || 0;
    this.successfulReps = 0;
    this.failedReps = 0;
    this.totalReps = 0;

    this.selectedGoal = {};
    this.shouldShowTutorial = true;
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
    this.highScore = await this.apiService.getHighScoreXP('beat_boxer');
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
        this.elements.titleBar.state = {
          data: {
            title: 'Beat Boxer',
            xp: this.highScore,
            transitionFrom: 'top',
          },
          attributes: {
            reCalibrationCount,
            visibility: 'visible',
          },
        };
        const goals = await this.apiService.getGameGoals('beat_boxer');
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
          const interval = setInterval(() => {
            if (this.globalReCalibrationCount !== reCalibrationCount) {
              console.log('Recalibrated goal selection');
              handSubscription.unsubscribe();
              this.elements.goalSelection.hide();
              this.elements.gameMenu.hide();
              this.elements.titleBar.hide();
              clearInterval(interval);
              resolve({});
            }
          }, 50);
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
          const interval = setInterval(() => {
            if (this.globalReCalibrationCount !== reCalibrationCount) {
              console.log('Recalibrated goal selection');
              handSubscription.unsubscribe();
              this.elements.gameMenu.hide();
              clearInterval(interval);
              resolve({});
            }
          }, 50);
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
        if (this.shouldShowTutorial) {
          this.ttsService.tts('Some instructions before we start');
          this.elements.ribbon.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
            data: {
              titles: ['INSTRUCTIONS'],
            },
          };
          await this.elements.sleep(2500);
          this.ttsService.tts(
            'For this activity, we will not require a chair. Make sure you have enough space to freely move around as you stand up for this activity.',
          );
          this.elements.overlay.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
            data: {
              cards: [
                {
                  icon: '/assets/images/overlay_icons/no-chair.png',
                  message: 'No chair required',
                },
                {
                  icon: '/assets/images/overlay_icons/space-to-move.png',
                  message: 'Space to move',
                },
                {
                  icon: '/assets/images/overlay_icons/stand-up.png',
                  message: 'Please stand up',
                },
              ],
              transitionDuration: 2500,
            },
          };
          await this.elements.sleep(9000);
        }
      },
    ];
  }

  tutorial() {
    if (this.shouldShowTutorial)
      return [
        async (reCalibrationCount: number) => {
          this.gameLifeCycleService.enterStage(GameLifeCycleStages.TUTORIAL);
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
          this.beatBoxerScene.showObstacle(
            'right',
            this.getRandomItemFromArray(this.positiveLevel),
          );

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
          this.gameLifeCycleService.resetStage(GameLifeCycleStages.TUTORIAL);
        },
      ];
    else return [];
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
    const analyticsObj: AnalyticsDTO = {
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
        coin: this.coin,
      },
    };
    if (rep.result === 'success') {
      if (rep.bagType === this.bagsAvailable.left) {
        this.bagsAvailable.left = undefined;
        clearTimeout(this.leftBagTimeout);
      }
      if (rep.bagType === this.bagsAvailable.right) {
        this.bagsAvailable.right = undefined;
        clearTimeout(this.rightBagTimeout);
      }
      this.successfulReps++;
      this.store.dispatch(game.repCompleted({ repsCompleted: this.successfulReps }));
      this.store.dispatch(game.setScore({ score: this.score }));
      this.failedReps = 0;
    } else if (rep.result === 'failure') {
      this.elements.health.state = {
        data: {
          value: --this.health,
          total: 3,
        },
        attributes: {
          visibility: 'visible',
          reCalibrationCount,
        },
      };
      clearTimeout(this.obstacleTimeout);
      if (rep.bagType === this.bagsAvailable.left) {
        this.bagsAvailable.left = undefined;
      }
      if (rep.bagType === this.bagsAvailable.right) {
        this.bagsAvailable.right = undefined;
      }
      this.failedReps++;
    } else {
      this.elements.health.state = {
        data: {
          value: --this.health,
          total: 3,
        },
        attributes: {
          visibility: 'visible',
          reCalibrationCount,
        },
      };
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

        this.scoreSubscription = this.beatBoxerScene.beatBoxerEvents.subscribe(
          (event: BeatBoxerEvent) => {
            if (event.result === 'success') {
              if (
                ([undefined, 'obstacle'].includes(this.bagsAvailable.left) ||
                  [undefined, 'obstacle'].includes(this.bagsAvailable.right)) &&
                event.timeoutDuration
              ) {
                this.elements.timeout.state = {
                  data: {
                    mode: 'show_score',
                    data: this.getTimeoutData(event.timeoutDuration),
                  },
                  attributes: {
                    visibility: 'visible',
                    reCalibrationCount,
                  },
                };
              }
              this.comboStreak++;
              if (this.maxCombo < this.comboStreak) {
                this.maxCombo = this.comboStreak;
              }

              if (this.comboStreak > 0 && this.comboStreak % 5 === 0) {
                this.levelIncrement += 0.2;
                this.combo *= 2;
              }
              this.score += this.combo * this.timeoutMultiplier(event.timeoutDuration);
              this.coin += this.combo * this.timeoutMultiplier(event.timeoutDuration);
              this.elements.score.state = {
                data: {
                  score: this.score,
                  highScore: this.highScore,
                  combo: this.combo,
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };

              const score = this.combo * this.timeoutMultiplier(event.timeoutDuration);
              if (event.position) {
                this.beatBoxerScene.animateScore(event.position.x, event.position.y, score);
              }

              if (this.highScore && this.score > this.highScore) {
                this.apiService.highScoreReachedEvent('Beat Boxer');
                this.elements.confetti.state = {
                  data: {},
                  attributes: {
                    visibility: 'visible',
                    reCalibrationCount,
                  },
                };
              }
            } else {
              this.comboStreak = 0;
              this.levelIncrement = 0;
              this.combo = 1;
            }

            const beatBoxerCombo = this.userContext.BEAT_BOXER_COMBO || 0;
            const totalPrompts = this.userContext.BEAT_BOXER_PROMPTS || 0;
            this.userContext = {
              ...this.userContext,
              BEAT_BOXER_COMBO: beatBoxerCombo > this.maxCombo ? beatBoxerCombo : this.maxCombo,
              BEAT_BOXER_PROMPTS: totalPrompts + 1,
            };

            if (this.selectedGoal) {
              this.badgesUnlocked = this.goalService.getUnlockedBadges(
                this.selectedGoal,
                this.userContext,
              );
              if (this.badgesUnlocked.length > 0) {
                // TODO: show notification for all badges unlocked, but the unlockNotification element doesn't support multiple notifications yet
                this.elements.unlockNotification.state = {
                  data: {
                    type: 'badge',
                    title: this.badgesUnlocked[0].name!,
                  },
                  attributes: {
                    visibility: 'visible',
                    reCalibrationCount,
                  },
                };
              }
            }
          },
        );

        this.elements.score.state = {
          data: {
            score: this.score,
            combo: this.combo,
            highScore: this.highScore,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.elements.health.state = {
          data: {
            value: this.health,
            total: 3,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

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
        this.beatBoxerScene.enableMusic();
        // while (this.successfulReps < this.config.minCorrectReps) {
        while (this.health > 0) {
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
          const leftBagPosition =
            this.getRandomItemFromArray(this.negativeLevel) - this.levelIncrement;
          const rightBagPosition =
            this.getRandomItemFromArray(this.positiveLevel) + this.levelIncrement;

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
          console.log('event data::coin::', this.coin);
          this.coin = 0;
          await this.elements.sleep(this.config.speed);
        }
        this.scoreSubscription?.unsubscribe();
        this.elements.score.hide();
        this.elements.health.hide();
      },
      async (reCalibrationCount: number) => {
        const isGoalCompleted = this.goalService.isGoalReached(this.selectedGoal, this.userContext);
        if (isGoalCompleted) {
          this.elements.titleBar.state = {
            data: {
              title: 'Beat Boxer',
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
          await this.elements.sleep(3000);
          this.elements.titleBar.hide();
          this.elements.goalSelection.hide();
        }
      },
      async (reCalibrationCount: number) => {
        const highScoreResp = await this.apiService.getHighScore('beat_boxer');
        const highScore = highScoreResp?.length ? highScoreResp[0].repsCompleted : 0;

        const shouldAllowReplay =
          Math.abs(this.successfulReps - highScore) <= 5 || Math.random() < 0.5;

        if (!shouldAllowReplay) return;

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
        const gameId = this.apiService.gameId;
        if (gameId) {
          await this.apiService.updateMaxCombo(gameId, this.maxCombo);
        }
        this.stopGame();

        console.log('updating user context');
        await this.apiService.updateUserContext([
          Metrics.BEAT_BOXER_COMBO,
          Metrics.BEAT_BOXER_PROMPTS,
          Metrics.MONTHLY_TIME_SPENT,
          Metrics.WEEKLY_TIME_SPENT,
          Metrics.PATIENT_TOTAL_ACTIVITY_DURATION,
          Metrics.PATIENT_TOTAL_ACTIVITY_COUNT,
        ]);

        this.badgesUnlocked.forEach(async (badge) => {
          this.elements.badgePopup.state = {
            data: {
              theme: badge.tier as any,
              title: this.activityHelperService.humanizeWord(badge.name || ''),
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.elements.confetti.state = {
            data: {},
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(3000);
          this.elements.confetti.state = {
            data: {},
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.badgePopup.state = {
            data: {},
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(500);
        });

        const achievementRatio = this.successfulReps / this.totalReps;
        if (achievementRatio < 0.25) {
          await this.apiService.updateOnboardingStatus({
            beat_boxer: false,
          });
        }
      },
    ];
  }
}

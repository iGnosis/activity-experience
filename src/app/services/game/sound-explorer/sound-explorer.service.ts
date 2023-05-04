import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ActivityBase,
  AnalyticsDTO,
  AnalyticsResultDTO,
  GameState,
  Genre,
  Origin,
  PreferenceState,
  Shape,
} from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';
import { ApiService } from '../../checkin/api.service';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';
import { SoundsService } from '../../sounds/sounds.service';
import { TtsService } from '../../tts/tts.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { SoundExplorerScene } from 'src/app/scenes/sound-explorer/sound-explorer.scene';
import { skip, Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { ActivityHelperService } from '../activity-helper/activity-helper.service';
import { GameLifecycleService } from '../../game-lifecycle/game-lifecycle.service';
import { GameLifeCycleStages } from 'src/app/types/enum';

@Injectable({
  providedIn: 'root',
})
export class SoundExplorerService implements ActivityBase {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private globalReCalibrationCount: number;

  qaGameSettings?: any;
  private gameSettings = environment.settings['sound_explorer'];
  private currentLevel = environment.settings['sound_explorer'].currentLevel;
  private config = {
    gameDuration:
      environment.settings['sound_explorer'].levels[this.currentLevel].configuration.gameDuration,
    speed: environment.settings['sound_explorer'].levels[this.currentLevel].configuration.speed,
  };

  private gameStartTime: number | null;
  private firstPromptTime: number | null;
  private loopStartTime: number | null;

  private isGameComplete = false;
  private shouldReplay = false;

  private gameDuration = this.config.gameDuration || 0;
  private totalDuration = this.config.gameDuration || 0;

  private difficulty = 1;
  private streak = 0;

  private health = 3;
  private score = 0;
  private currentScore = 0;
  private currentRepScore = 0;
  private highScore = 0;
  private comboMissed = 0;
  private comboStreak = 0;
  private maxCombo = 0;
  private redOrbsCollected = 0;
  private normalOrbsCollected = 0;
  private combo = 1;

  private successfulReps = 0;
  private totalReps = 0;
  private pointsGained = 0;
  private shapes: Shape[] = ['circle', 'triangle', 'rectangle', 'hexagon'];
  private originsWithAngleRange: { [key in Origin]?: number[] } = {
    // 'bottom-right': [-110, -115],
    // 'bottom-left': [-70, -75],
    // 'bottom-center': [-120, -70],
    'left-center': [-65, -60],
    'right-center': [-110, -105],
    'top-left': [40, 50],
    'top-right': [150, 160],
  };
  private scoreSubscription: Subscription;
  private getRandomItemFromArray = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };
  private getRandomNumberBetweenRange = (...args: number[]) => {
    return Math.floor(Math.random() * (args[1] - args[0] + 1)) + args[0];
  };

  private getMultipleRandomItems = <T>(arr: T[], num: number) => {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, num);
  };

  private drawShapes = async (
    numberOfShapes: number,
    timeoutBetweenShapes = 200,
    promptDetails?: { angle: number; shapes: Shape[]; position: Origin },
  ): Promise<{ angle: number; shapes: Shape[]; position: Origin }> => {
    this.soundExplorerScene.setNextNote();

    const randomPosition =
      promptDetails?.position ||
      this.getRandomItemFromArray(Object.keys(this.originsWithAngleRange) as Origin[]);
    const shapes: Shape[] =
      promptDetails?.shapes || this.getMultipleRandomItems(this.shapes, numberOfShapes);
    const randomAngle: number =
      typeof promptDetails?.angle === 'number'
        ? promptDetails?.angle
        : this.getRandomNumberBetweenRange(...this.originsWithAngleRange[randomPosition]!);
    for (let i = 0; i < numberOfShapes; i++) {
      const shape = shapes[i];
      this.soundExplorerScene.showShapes([shape], randomPosition, randomAngle, this.config.speed);
      await this.elements.sleep(timeoutBetweenShapes);
    }
    return { angle: randomAngle, shapes, position: randomPosition };
  };

  private drawObstacle = async (position?: Origin, angle?: number, promptPosition?: Origin) => {
    const availablePositions: Origin[] = (
      Object.keys(this.originsWithAngleRange) as Origin[]
    ).filter((pos) => pos !== promptPosition);

    const randomPosition = position || this.getRandomItemFromArray(availablePositions);
    const randomAngle =
      typeof angle === 'number'
        ? angle
        : this.getRandomNumberBetweenRange(...this.originsWithAngleRange[randomPosition]!);
    this.soundExplorerScene.showShapes(['wrong'], randomPosition, randomAngle, this.config.speed);
    return { obstacleAngle: randomAngle, obstaclePosition: randomPosition };
  };

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
    private gameStateService: GameStateService,
    private calibrationService: CalibrationService,
    private apiService: ApiService,
    private ttsService: TtsService,
    private handTrackerService: HandTrackerService,
    private soundsService: SoundsService,
    private soundExplorerScene: SoundExplorerScene,
    private activityHelperService: ActivityHelperService,
    private gameLifeCycleService: GameLifecycleService,
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
  }

  resetVariables() {
    this.isServiceSetup = false;
    this.genre = 'jazz';
    this.qaGameSettings = undefined;
    this.gameSettings = environment.settings['sound_explorer'];
    this.currentLevel = environment.settings['sound_explorer'].currentLevel;
    this.config = {
      gameDuration:
        environment.settings['sound_explorer'].levels[this.currentLevel].configuration.gameDuration,
      speed: environment.settings['sound_explorer'].levels[this.currentLevel].configuration.speed,
    };
    this.gameStartTime = null;
    this.firstPromptTime = null;
    this.loopStartTime = null;
    this.isGameComplete = false;
    this.shouldReplay = false;
    this.gameDuration = this.config.gameDuration || 0;
    this.totalDuration = this.config.gameDuration || 0;
    this.difficulty = 1;
    this.streak = 0;
    this.successfulReps = 0;
    this.totalReps = 0;

    this.health = 3;
    this.score = 0;
    this.currentScore = 0;
    this.currentRepScore = 0;
    this.highScore = 0;
    this.comboMissed = 0;
    this.comboStreak = 0;
    this.combo = 1;

    this.pointsGained = 0;
    this.shapes = ['circle', 'triangle', 'rectangle', 'hexagon'];
    this.originsWithAngleRange = {
      'left-center': [-65, -60],
      'right-center': [-110, -105],
      'top-left': [40, 50],
      'top-right': [150, 160],
    };
    this.scoreSubscription?.unsubscribe();
  }

  async setupConfig() {
    const settings = await this.apiService.getGameSettings('sound_explorer');
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
    this.highScore = await this.apiService.getHighScoreXP('sound_explorer');
    this.soundExplorerScene.enable();
    this.soundExplorerScene.scene.start('soundExplorer');
  }

  async setup() {
    await this.setupConfig();
    return new Promise<void>(async (resolve, reject) => {
      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.soundExplorerScene.loadAssets(this.genre);
        this.gameSettings.levels[this.currentLevel].configuration.musicSet =
          this.soundExplorerScene.currentSet;
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
        this.ttsService.tts("Raise one of your hands when you're ready to start.");
        this.elements.guide.state = {
          data: {
            title: "Raise your hand when you're ready to start.",
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
    ];
  }

  tutorial() {
    return [
      async (reCalibrationCount: number) => {
        // this.soundExplorerScene.enableMusic();
        this.gameLifeCycleService.enterStage(GameLifeCycleStages.TUTORIAL);
        this.soundsService.playActivityInstructionSound(this.genre);

        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['A Guide to Sound Slicer'],
          },
        };
        await this.elements.sleep(2500);

        this.ttsService.tts(
          'The objective of this game is to interact with the green shapes that appear on the screen.',
        );
        this.elements.guide.state = {
          data: {
            title: 'The objective of this game is to interact with the shapes on screen.',
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);

        this.ttsService.tts('Let’s try it out.');
        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2500);
      },
      async (reCalibrationCount: number) => {
        // one prompt
        let currentScore = 0;
        this.soundExplorerScene.score.next(0);
        const scoreSubscription = this.soundExplorerScene.score.subscribe(
          (score) => (currentScore = score),
        );
        while (currentScore === 0) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.drawShapes(1);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
          if (currentScore === 0) {
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
        }
        scoreSubscription.unsubscribe();
      },
      async (reCalibrationCount: number) => {
        // 2 prompts
        this.ttsService.tts('The more shapes you interact with, the more will appear on screen.');
        this.elements.guide.state = {
          data: {
            title: 'The more shapes you interact with, the more will appear on screen.',
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        let currentScore = 0;
        this.soundExplorerScene.score.next(0);
        const scoreSubscription = this.soundExplorerScene.score.subscribe(
          (score) => (currentScore = score),
        );
        while (currentScore === 0) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.drawShapes(2);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
          if (currentScore === 0) {
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
        }
        scoreSubscription.unsubscribe();
      },
      async (reCalibrationCount: number) => {
        // 3 prompts
        this.ttsService.tts('Helping you get a higher score.');
        this.elements.guide.state = {
          data: {
            title: 'Helping you get a higher score.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        let currentScore = 0;
        this.soundExplorerScene.score.next(0);
        const scoreSubscription = this.soundExplorerScene.score.subscribe(
          (score) => (currentScore = score),
        );
        while (currentScore === 0) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.drawShapes(3);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
          if (currentScore === 0) {
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
        }
        scoreSubscription.unsubscribe();
      },
      async (reCalibrationCount: number) => {
        let trialComplete = false;
        this.elements.timer.state = {
          data: {
            mode: 'start',
            isCountdown: true,
            duration: 10 * 1000,
            onComplete: () => {
              trialComplete = true;
            },
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        while (!trialComplete) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.drawShapes(3);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
        }
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        // obstacle
        this.ttsService.tts('If you see a red shape on your screen, try to avoid them.');
        this.elements.guide.state = {
          data: {
            title: 'If you see a red shape on your screen, try to avoid them.',
            titleDuration: 3500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3500);
        let score = 0;
        this.soundExplorerScene.score.next(0);
        const scoreSubscription = this.soundExplorerScene.score
          .pipe(skip(1))
          .subscribe(() => (score = -1));
        do {
          score = 0;
          this.drawObstacle();
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
          if (score < 0) {
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
        } while (score < 0);
        scoreSubscription.unsubscribe();
        this.soundExplorerScene.score.next(0);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Good job! Looks like you're ready to start the activity.");
        this.elements.guide.state = {
          data: {
            title: "Good job! Looks like you're ready to start the activity.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3500);
        await this.apiService.updateOnboardingStatus({
          sound_explorer: true,
        });
        await this.elements.sleep(3000);
        this.soundsService.stopActivityInstructionSound(this.genre);
        // this.soundExplorerScene.enableMusic(false);
        this.soundExplorerScene.resetNotes();
        this.gameLifeCycleService.resetStage(GameLifeCycleStages.TUTORIAL);
      },
    ];
  }

  debounce<F extends (...params: any[]) => void>(fn: F, delay: number) {
    let timeoutID: number | null = null;
    return function (this: any, ...args: any[]) {
      clearTimeout(timeoutID!);
      timeoutID = window.setTimeout(() => fn.apply(this, args), delay);
    } as F;
  }
  preLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.soundExplorerScene.playBacktrack();
        this.soundExplorerScene.enableMusic();

        let score = 0;

        const updateScore = (event: {
          result: 'success' | 'failure';
          position: { x: number; y: number };
        }) => {
          if (event.position) {
            this.soundExplorerScene.animateScore(event.position.x, event.position.y, score);
          }
          score = 0;
        };

        const debounceUpdatedScore = this.debounce((event: any) => {
          updateScore(event);
        }, 500);

        const subscription = this.soundExplorerScene.soundExplorerEvents.subscribe((event) => {
          if (event.result === 'success') {
            this.normalOrbsCollected += 1;
            this.successfulReps++;
            score += 1;
            debounceUpdatedScore(event);
          } else if (event.result === 'failure') {
            this.redOrbsCollected += 1;
            this.health -= 1;
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
            this.comboStreak = 0;
            this.comboMissed = 0;
            this.combo = 1;
          }
          this.totalReps++;
        });

        this.ttsService.tts('Next activity. Sound Explorer.');
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
                <h1 class="pt-2">Range of Motion and Balance</h2>
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
        await this.elements.sleep(7000);
        this.loopStartTime = Date.now();
        this.ttsService.tts("Raise one of your hands when you're ready to start.");
        this.elements.guide.state = {
          data: {
            title: "Raise your hand when you're ready to start.",
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
        this.elements.guide.hide();
      },
    ];
  }

  async showPrompt(promptDetails: any, promptId: string, reCalibrationCount?: number) {
    const isPromptFromBenchmark: boolean = Object.keys(promptDetails).length > 1;
    this.difficulty = this.getRandomNumberBetweenRange(2, 5);
    const currentPromptDetails = await this.drawShapes(
      this.difficulty,
      isPromptFromBenchmark ? 0 : 200,
      promptDetails,
    );

    const promptTimestamp = Date.now();

    let obstaclePromptDetails;
    if (promptDetails.showObstacle)
      obstaclePromptDetails = await this.drawObstacle(
        promptDetails.obstaclePosition,
        promptDetails.obstacleAngle,
        currentPromptDetails.position,
      );

    await this.soundExplorerScene.waitForCollisionOrTimeout();
    const resultTimestamp = Date.now();

    // Todo: replace placeholder analytics values.
    const analyticsObj: AnalyticsDTO = {
      prompt: {
        id: promptId,
        type: this.difficulty === 1 ? 'single' : this.difficulty === 2 ? 'harmony' : 'chord',
        timestamp: promptTimestamp,
        data: {
          ...promptDetails,
          ...currentPromptDetails,
          ...obstaclePromptDetails,
        },
      },
      reaction: {
        type: 'slice',
        timestamp: Date.now(),
        startTime: Date.now(),
        completionTimeInMs:
          this.pointsGained > 0 ? Math.abs(resultTimestamp - promptTimestamp) : null, // seconds between reaction and result if user interacted with the shapes
      },
      result: {
        type: this.pointsGained <= 0 ? 'failure' : ('success' as AnalyticsResultDTO['type']),
        timestamp: resultTimestamp,
        score: this.pointsGained,
        coin: this.pointsGained,
      },
    };

    if (this.currentRepScore < 2) {
      this.comboStreak = 0;
      this.comboMissed++;
      if (this.comboMissed >= 2) {
        this.comboMissed = 0;
        this.combo = 1;
      }
    } else {
      this.comboMissed = 0;
      this.comboStreak++;
      if (this.maxCombo < this.comboStreak) {
        this.maxCombo = this.comboStreak;
      }
      if (this.comboStreak % 5 == 0) {
        this.comboStreak = 0;
        this.combo *= 2;
      }
      this.score += this.currentRepScore * this.combo * (this.combo > 1 ? this.difficulty : 1);
      this.elements.score.state = {
        attributes: {
          visibility: 'visible',
          reCalibrationCount,
        },
        data: {
          score: this.score,
          highScore: this.highScore,
        },
      };
    }

    if (this.highScore !== undefined && this.score > this.highScore) {
      this.apiService.highScoreReachedEvent('Sound Explorer');
      this.elements.confetti.state = {
        data: {},
        attributes: {
          visibility: 'visible',
          reCalibrationCount,
        },
      };
    }
    analyticsObj.result.coin =
      this.currentRepScore * this.combo * (this.combo > 1 ? this.difficulty : 1);

    this.currentRepScore = 0;
    this.pointsGained = 0;

    return { analyticsObj };
  }

  loop() {
    return [
      // Indicates user the start of the game.
      async (reCalibrationCount: number) => {
        // this.soundExplorerScene.enableMusic();
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Get Ready to Start', 'On your mark', 'Get Set', 'GO!'],
            titleDuration: 1600,
            tts: true,
          },
        };
        await this.elements.sleep(9000);
      },

      // The actual meat. This function keeps runnning until the timer runs out.
      async (reCalibrationCount: number) => {
        this.soundExplorerScene.score.next(this.score);
        this.scoreSubscription = this.soundExplorerScene.score.subscribe((score) => {
          this.pointsGained = score - this.currentScore; // points obtained in current rep
          this.currentRepScore += this.pointsGained;
          this.currentScore = score;
          this.store.dispatch(game.setScore({ score }));
        });

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
        this.store.dispatch(game.pushAnalytics({ analytics: [startPrompt] }));

        this.isGameComplete = false;

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

        while (this.health > 0) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }

          const showObstacle = Math.random() > 0.5;
          const promptId = uuidv4();
          const { analyticsObj } = await this.showPrompt(
            { showObstacle },
            promptId,
            reCalibrationCount,
          );
          await this.elements.sleep(100);
          this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));
        }
        this.elements.banner.hide();
        this.elements.guide.hide();
      },

      // this probably should be in postLoop() ?
      async (reCalibrationCount: number) => {
        this.scoreSubscription.unsubscribe();
        this.elements.score.hide();
        this.elements.health.hide();
      },
    ];
  }

  stopGame() {
    this.soundExplorerScene.enableMusic(false);
    this.soundExplorerScene.stopBacktrack();
    this.soundExplorerScene.disable();
    this.soundExplorerScene.scene.stop('soundExplorer');
    this.gameSettings.levels[this.currentLevel].configuration.speed = this.config.speed;
    this.apiService.updateGameSettings('sound_explorer', this.gameSettings);
  }

  postLoop() {
    return [
      async (reCalibrationCount: number) => {
        const gameId = this.apiService.gameId;
        if (gameId) {
          await this.apiService.updateOrbCount(gameId, {
            redOrbs: this.redOrbsCollected,
            normalOrbs: this.normalOrbsCollected,
          });
          await this.apiService.updateMaxCombo(gameId, this.maxCombo);
        }
        this.stopGame();
        const achievementRatio = this.successfulReps / this.totalReps;
        if (achievementRatio < 0.25) {
          await this.apiService.updateOnboardingStatus({
            sound_explorer: false,
          });
        }
      },
    ];
  }
}

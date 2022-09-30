import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AnalyticsDTO, GameState, Genre, PreferenceState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';
import { CheckinService } from '../../checkin/checkin.service';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';
import { SoundsService } from '../../sounds/sounds.service';
import { TtsService } from '../../tts/tts.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { Origin, Shape, SoundExplorerScene } from 'src/app/scenes/sound-explorer.scene';
import { sampleSize as _sampleSize } from 'lodash';
import { Subscription, take } from 'rxjs';
import { GoogleAnalyticsService } from '../../google-analytics/google-analytics.service';

@Injectable({
  providedIn: 'root',
})
export class SoundExplorerService {
  private genre: Genre = 'jazz';
  private globalReCalibrationCount: number;
  private config = {
    gameDuration: environment.settings['sound_explorer'].configuration.gameDuration,
    speed: environment.settings['sound_explorer'].configuration.speed,
  };
  private isGameComplete = false;
  private successfulReps = 0;
  private totalReps = 0;
  private currentScore = 0;
  private pointsGained = 0;
  private shapes: Shape[] = ['circle', 'triangle', 'rectangle', 'hexagon'];
  private originsWithAngleRange: { [key in Origin]: number[] } = {
    'bottom-right': [-110, -115],
    'bottom-left': [-70, -75],
    'bottom-center': [-120, -70],
    'left-center': [-70, -65],
    'right-center': [-120, -110],
    'top-left': [40, 50],
    'top-right': [150, 160],
  };
  private analytics: AnalyticsDTO[] = [];
  private scoreSubscription: Subscription;
  private isServiceSetup = false;
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
  ): Promise<Shape[]> => {
    this.soundExplorerScene.setNextNote();

    const randomPosition = this.getRandomItemFromArray(
      Object.keys(this.originsWithAngleRange) as Origin[],
    );
    const shapes: Shape[] = this.getMultipleRandomItems(this.shapes, numberOfShapes);
    for (let i = 0; i < numberOfShapes; i++) {
      const shape = shapes[i];
      this.soundExplorerScene.showShapes(
        [shape],
        randomPosition,
        this.getRandomNumberBetweenRange(...this.originsWithAngleRange[randomPosition]),
        this.config.speed,
      );
      await this.elements.sleep(timeoutBetweenShapes);
    }
    return shapes;
  };

  private drawObstacle = async () => {
    const randomPosition = this.getRandomItemFromArray(
      Object.keys(this.originsWithAngleRange) as Origin[],
    );
    this.soundExplorerScene.showShapes(
      ['wrong'],
      randomPosition,
      this.getRandomNumberBetweenRange(...this.originsWithAngleRange[randomPosition]),
      this.config.speed,
    );
  };

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private gameStateService: GameStateService,
    private calibrationService: CalibrationService,
    private checkinService: CheckinService,
    private ttsService: TtsService,
    private handTrackerService: HandTrackerService,
    private soundsService: SoundsService,
    private soundExplorerScene: SoundExplorerScene,
    private googleAnalyticsService: GoogleAnalyticsService,
  ) {
    this.handTrackerService.enable();
    this.store
      .select((state) => state.game)
      .subscribe((game) => {
        if (game.id) {
          //Update the game state whenever redux state changes
          const { id, ...gameState } = game;
          this.gameStateService.updateGame(id, gameState);
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.soundsService.loadMusicFiles(this.genre);
        } else {
          this.genre === 'jazz' && this.soundsService.loadMusicFiles('jazz');
        }
      });

    this.soundExplorerScene.enable();
    this.soundExplorerScene.enableCollisionDetection();
    this.soundExplorerScene.enableLeftHand();
    this.soundExplorerScene.enableRightHand();
  }

  async setup() {
    return new Promise<void>(async (resolve, reject) => {
      this.soundExplorerScene.scene.start('soundExplorer');

      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.soundExplorerScene.waitForAssetsToLoad();
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

          this.elements.banner.state = {
            data: {},
            attributes: {
              reCalibrationCount,
              visibility: 'hidden',
            },
          };
        }
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
        this.soundExplorerScene.enableMusic();
        this.soundsService.playActivityInstructionSound(this.genre);
        this.ttsService.tts('Use your hands to interact with the shapes you see on the screen.');
        this.elements.guide.state = {
          data: {
            title: 'Use your hands to interact with the shapes on screen.',
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        let score = 0;
        this.soundExplorerScene.score.next(0);
        const scoreSubscription = this.soundExplorerScene.score.subscribe(
          (currentScore) => (score = currentScore),
        );
        while (score === 0) {
          const randomPosition = this.getRandomItemFromArray(
            Object.keys(this.originsWithAngleRange) as Origin[],
          );
          this.drawShapes(1, 500);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
        }
        scoreSubscription.unsubscribe();
        this.ttsService.tts(
          'Did you hear that? You just created musical note by interacting with the shape.',
        );
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Did you hear that?',
            description: 'You just created music by interacting with the shape.',
            src: 'assets/images/beat-boxer/did-you-hear-that.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(1000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Let's try a few more.");
        this.elements.guide.state = {
          data: {
            title: "Let's try a few more.",
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2500);
        this.elements.score.state = {
          data: {
            label: '',
            value: 0,
            goal: 3,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        // Todo: 3 reps with single notes
        let repCount = -1;
        const scoreSubscription = this.soundExplorerScene.score.subscribe(() => {
          repCount++;
          this.elements.score.state = {
            data: {
              label: '',
              value: repCount,
              goal: 3,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
        });
        while (repCount < 3) {
          this.drawShapes(1);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
        }
        scoreSubscription.unsubscribe();
        await this.elements.sleep(2000);
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.ttsService.tts('Good job. But single notes are just the beginning.');
        this.elements.guide.state = {
          data: {
            title: 'Good job but single notes are just the beginning.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3500);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Let's try interacting with more than 1 shape now.");
        this.elements.guide.state = {
          data: {
            title: "Let's try interacting with more than 1 shape now.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3500);
        let score = 0;
        this.soundExplorerScene.score.next(0);
        const scoreSubscription = this.soundExplorerScene.score.subscribe(
          (currentScore) => (score = currentScore),
        );
        while (score === 0) {
          this.drawShapes(2);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
        }
        scoreSubscription.unsubscribe();
        this.ttsService.tts('When you play multiple notes at the same time you create a harmony.');
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'You created harmony!',
            description: 'When multiple notes are played together you create a harmony.',
            src: 'assets/images/beat-boxer/did-you-hear-that.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(1000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Now let's try interacting with 3 shapes in one motion.");
        this.elements.guide.state = {
          data: {
            title: 'Try interacting with 3 shapes in one motion.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3500);
        let score = 0;
        this.soundExplorerScene.score.next(0);
        const scoreSubscription = this.soundExplorerScene.score.subscribe(
          (currentScore) => (score = currentScore),
        );
        while (score === 0) {
          this.drawShapes(3);
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          await this.elements.sleep(1000);
        }
        scoreSubscription.unsubscribe();
        this.ttsService.tts(
          'When you interact with 3 or more shapes in one motion, you create a chord.',
        );
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'You created a chord!',
            description: 'When 3 or more shapes are interacted with, you create a chord',
            src: 'assets/images/beat-boxer/did-you-hear-that.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(1000);
        this.ttsService.tts('Playing chords will give you extra points.');
        this.elements.guide.state = {
          data: {
            title: 'Playing chords will give you extra points.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3500);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Let's play a few more chords.");
        this.elements.guide.state = {
          data: {
            title: "Let's play a few chords.",
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2500);
        this.elements.score.state = {
          data: {
            label: '',
            value: 0,
            goal: 3,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        // Todo: 3 reps with chords
        let repCount = 0;
        let currentScore = 0;
        let prevScore = 0;
        const scoreSubscription = this.soundExplorerScene.score.subscribe((score) => {
          currentScore = score;
        });
        while (repCount < 3) {
          this.drawShapes(3);
          if (repCount === 3) this.drawObstacle();
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          if (prevScore !== currentScore) {
            repCount++;
            this.elements.score.state = {
              data: {
                label: '',
                value: repCount,
                goal: 3,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
            prevScore = currentScore;
          }
          await this.elements.sleep(1000);
        }
        scoreSubscription.unsubscribe();
        await this.elements.sleep(2000);
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts(
          'If you touch the X shape, you will lose your chord streak. Try to avoid them.',
        );
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: "Avoid the 'X' shape.",
            description:
              "If you interact with an 'X' shape, you have to build up to playing the chords again.",
            src: 'assets/images/beat-boxer/did-you-hear-that.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(1000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Looks like you're ready to put it all together now.");
        this.elements.guide.state = {
          data: {
            title: "Looks like you're ready to put it all together.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3500);
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
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Ready?');
        await this.elements.sleep(1500);
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['3', '2', '1', 'GO!'],
            titleDuration: 1200,
            tts: true,
          },
        };
        await this.elements.sleep(8000);
        // Todo: 30 seconds of tutorial
        let isGameComplete = false;
        const onComplete = () => {
          isGameComplete = true;
        };
        this.elements.timer.state = {
          data: {
            mode: 'start',
            isCountdown: true,
            duration: 30 * 1000,
            onComplete,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        let difficulty = 1;
        let successfulReps = 0;
        while (!isGameComplete) {
          this.drawShapes(difficulty);
          const shouldShowXMark = Math.random() > 0.5;
          if (shouldShowXMark) this.drawObstacle();
          const rep = await this.soundExplorerScene.waitForCollisionOrTimeout();
          // if successful rep 3 times, increase difficulty
          successfulReps++;
          if (successfulReps !== 0 && successfulReps % 3 === 0 && difficulty < 4) difficulty++;
          await this.elements.sleep(1000);
        }
        await this.elements.sleep(2000);
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Your time's up");
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['TIMES UP!'],
          },
        };
        await this.elements.sleep(3500);
        this.ttsService.tts('The guide is complete.');
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['GUIDE COMPLETED'],
            titleDuration: 2000,
          },
        };
        await this.checkinService.updateOnboardingStatus({
          sound_explorer: true,
        });
        await this.elements.sleep(3000);
        this.soundsService.pauseActivityInstructionSound(this.genre);
        this.soundExplorerScene.enableMusic(false);
        this.soundExplorerScene.resetNotes();
      },
    ];
  }

  preLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Last activity. Sound Explorer.');
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">Last Activity</h2>
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
        await this.elements.sleep(7000);
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

  loop() {
    return [
      // Indicates user the start of the game.
      async (reCalibrationCount: number) => {
        this.soundExplorerScene.enableMusic();
        this.ttsService.tts('Ready?');
        await this.elements.sleep(1500);

        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['3', '2', '1', 'GO!'],
            titleDuration: 1200,
            tts: true,
          },
        };
        await this.elements.sleep(8000);
      },

      // Initializes score & timer.
      // When the timer runs out, loop() is ended.
      async (reCalibrationCount: number) => {
        const updateElapsedTime = (elapsedTime: number) => {
          if (elapsedTime >= this.config.gameDuration!) this.isGameComplete = true;
          this.store.dispatch(game.setTotalElapsedTime({ totalDuration: elapsedTime }));
        };
        this.elements.timer.state = {
          data: {
            mode: 'start',
            isCountdown: true,
            duration: this.config.gameDuration! * 1000,
            onPause: updateElapsedTime,
            onComplete: updateElapsedTime,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
      },

      // The actual meat. This function keeps runnning until the timer runs out.
      async (reCalibrationCount: number) => {
        let difficulty = 1;
        this.soundExplorerScene.score.next(this.currentScore);
        this.scoreSubscription = this.soundExplorerScene.score.subscribe((score) => {
          this.elements.score.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
            data: {
              label: 'Score',
              value: score,
            },
          };
          this.pointsGained = score - this.currentScore; // points obtained in current rep
          this.currentScore = score;
          this.store.dispatch(game.setScore({ score }));
        });
        let streak = 0;
        while (!this.isGameComplete) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          const shapes = await this.drawShapes(difficulty);
          const promptTimestamp = Date.now();

          const showObstacle = Math.random() > 0.5;
          if (showObstacle) this.drawObstacle();

          await this.soundExplorerScene.waitForCollisionOrTimeout();
          const resultTimestamp = Date.now();
          await this.elements.sleep(100);
          this.totalReps++;

          // if low points, reset difficulty
          if (this.pointsGained < difficulty / 2) {
            difficulty = 1;
            streak = 0;
          } else {
            streak++;
            this.successfulReps++;
          }
          // if continously high points, increase difficulty
          if (streak !== 0 && streak % 3 === 0 && difficulty < 4) difficulty++;
          // Todo: replace placeholder analytics values.
          this.analytics = [
            ...this.analytics,
            {
              prompt: {
                type: difficulty === 1 ? 'single' : difficulty === 2 ? 'harmony' : 'chord',
                timestamp: promptTimestamp,
                data: {
                  shapes,
                },
              },
              reaction: {
                type: 'slice',
                timestamp: Date.now(),
                startTime: Date.now(),
                completionTime:
                  this.pointsGained > 0 ? Math.abs(resultTimestamp - promptTimestamp) / 1000 : null, // seconds between reaction and result if user interacted with the shapes
              },
              result: {
                type: this.pointsGained <= 0 ? 'failure' : 'success',
                timestamp: resultTimestamp,
                score: this.pointsGained,
              },
            },
          ];
          this.store.dispatch(game.pushAnalytics({ analytics: this.analytics }));
          if (this.pointsGained === 0) {
            console.log('%c Not changed! ', 'background: #222; color: red');
          }
        }
      },

      // this probably should be in postLoop() ?
      async (reCalibrationCount: number) => {
        this.scoreSubscription.unsubscribe();
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

        this.ttsService.tts("Your time's up");
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['TIMES UP!'],
          },
        };
        await this.elements.sleep(5000);
      },
    ];
  }

  postLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.soundExplorerScene.enableMusic(false);
        this.soundExplorerScene.disable();
        this.soundExplorerScene.scene.stop('soundExplorer');
        const achievementRatio = this.successfulReps / this.totalReps;
        if (achievementRatio < 0.6) {
          await this.checkinService.updateOnboardingStatus({
            sound_explorer: false,
          });
        }
        this.ttsService.tts(
          `Your score is ${this.currentScore}, time completed ${this.config
            .gameDuration!} seconds.`,
        );
        const highScore = await this.checkinService.getHighScore('sound_explorer');
        let totalDuration: {
          minutes: string;
          seconds: string;
        };
        // eslint-disable-next-line prefer-const
        totalDuration = this.checkinService.getDurationForTimer(this.config.gameDuration!);
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'outro',
            htmlStr: `
          <div class="pl-10 text-start px-14" style="padding-left: 20px;">
            <h1 class="pt-8 display-3">Sound Explorer</h1>
            <h2 class="pt-7">Score: ${this.currentScore}</h2>
            <h2 class="pt-5">High Score: ${Math.max(
              highScore && highScore.length ? highScore[0].repsCompleted : 0,
              this.currentScore,
            )}</h2>
            <h2 class="pt-5">Time Completed: ${totalDuration.minutes}:${
              totalDuration.seconds
            } minutes</h2>
          <div>
          `,
            buttons: [
              {
                title: 'Back to Homepage',
                progressDurationMs: 10000,
              },
            ],
          },
        };

        await this.elements.sleep(12000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Please raise one of your hands to close the game.');
        this.elements.guide.state = {
          data: {
            title: 'Please raise one of your hands to close the game.',
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
        await this.elements.sleep(1000);
        this.store.dispatch(game.gameCompleted());
        this.googleAnalyticsService.sendEvent('level_end', {
          level_name: 'sound_explorer',
        });
        this.gameStateService.postLoopHook();
        window.parent.postMessage(
          {
            type: 'end-game',
          },
          '*',
        );
      },
    ];
  }
}
